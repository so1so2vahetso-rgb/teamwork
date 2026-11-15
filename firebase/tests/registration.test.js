import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, signOut } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { createRegistrationService } from '../../src/features/auth/registrationService.js'

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw Error('Run npm run test:rules; never target a real project.')
let env
const apps = []
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-teamwork', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firebase/firestore.rules', 'utf8') } })
})
after(async () => { await Promise.all(apps.map(deleteApp)); await env?.cleanup() })
const profile = (uid, extra={}) => ({ uid, email: `${uid}@example.com`, displayName: 'Nguyễn An', role: 'member', createdAt: serverTimestamp(), ...extra })
const dbFor = uid => env.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore()

test('owner creates and reads a valid member profile', async () => {
  const db = dbFor('owner')
  await assertSucceeds(setDoc(doc(db, 'users', 'owner'), profile('owner')))
  assert.equal((await assertSucceeds(getDoc(doc(db,'users','owner')))).data().role,'member')
})
test('unauthenticated reads and writes are blocked', async () => {
  const db=env.unauthenticatedContext().firestore()
  await assertFails(getDoc(doc(db,'users','owner')))
  await assertFails(setDoc(doc(db,'users','anon'),profile('anon')))
})
test('member cannot create/read another profile or list users', async () => {
  const db=dbFor('outsider')
  await assertFails(setDoc(doc(db,'users','someone-else'),profile('someone-else')))
  await assertFails(getDoc(doc(db,'users','owner')))
  await assertFails(getDocs(collection(db,'users')))
})
test('forged admin, email, uid, password fields and client timestamps are rejected', async () => {
  for (const [index,extra] of [{role:'admin'},{email:'victim@example.com'},{uid:'fake'},{password:'never-save-this'},{createdAt:new Date(0)},{displayName:'   '}].entries()) {
    const uid=`invalid-${index}`
    await assertFails(setDoc(doc(dbFor(uid),'users',uid),profile(uid,extra)))
  }
})
test('member cannot edit/delete profile or touch other collections', async () => {
  const db=dbFor('owner')
  await assertFails(updateDoc(doc(db,'users','owner'),{role:'admin'}))
  await assertFails(deleteDoc(doc(db,'users','owner')))
  await assertFails(setDoc(doc(db,'groups','fake'),{name:'Fake'}))
})

function service() {
  const app=initializeApp({apiKey:'demo-api-key',projectId:'demo-teamwork'},`test-${apps.length}`);apps.push(app)
  const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true})
  const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8080)
  return {auth,db,service:createRegistrationService({auth,db})}
}
async function setRules(rules) {
  const loader=await initializeTestEnvironment({projectId:'demo-teamwork',firestore:{host:'127.0.0.1',port:8080,rules}})
  await loader.cleanup()
}
test('real SDK registration saves normalized member profile without password', async () => {
  const {auth,db,service:api}=service()
  const result=await api.register({name:'  Nguyễn Văn An  ',email:'  member@example.com  ',password:'example123'})
  const data=(await getDoc(doc(db,'users',result.uid))).data()
  assert.equal(data.email,'member@example.com');assert.equal(data.displayName,'Nguyễn Văn An');assert.equal(data.role,'member')
  assert.deepEqual(Object.keys(data).sort(),['createdAt','displayName','email','role','uid'])
  assert.ok(data.createdAt.toMillis()>0)
  assert.equal(auth.currentUser.uid,result.uid)
  await assert.rejects(api.register({name:'Other',email:'other@example.com',password:'example123'}),{code:'registration/session-active'})
  await signOut(auth)
  await assert.rejects(api.register({name:'An',email:'member@example.com',password:'example123'}),{code:'auth/email-already-in-use'})
})
test('Auth success plus blocked profile is recoverable without recreating account or overwriting profile', async () => {
  const {auth,db,service:api}=service()
  await setRules("rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if false; } } }")
  try {
    await assert.rejects(api.register({name:'Bình',email:'recovery@example.com',password:'example123'}),{code:'registration/profile-incomplete'})
    assert.ok(auth.currentUser)
  } finally {await setRules(readFileSync('firebase/firestore.rules','utf8'))}
  const uid=auth.currentUser.uid
  await api.completeProfile('Bình')
  const before=(await getDoc(doc(db,'users',uid))).data()
  await api.completeProfile('Different name')
  const after=(await getDoc(doc(db,'users',uid))).data()
  assert.equal(auth.currentUser.uid,uid);assert.equal(after.displayName,'Bình');assert.equal(after.createdAt.toMillis(),before.createdAt.toMillis())
})
