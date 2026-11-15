import { test, after, before } from 'node:test'
import assert from 'node:assert/strict'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { createSessionService, resolveAccountRole } from '../../src/features/auth/sessionService.js'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) throw Error('Use npm run test:rules; no production tests.')
const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-teamwork' }, 'session-tests')
const auth = getAuth(app)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
let env
before(async () => {
  const rules = readFileSync('firebase/firestore.rules','utf8').replace(/return request\.auth != null && request\.auth\.uid == '[^']*';/, "return request.auth != null && request.auth.uid == 'test-admin';")
  env=await initializeTestEnvironment({projectId:'demo-teamwork',firestore:{host:'127.0.0.1',port:8080,rules}})
})
after(async () => {await deleteApp(app); await env?.cleanup()})

test('login restores correct user, wrong credentials fail, logout clears real Auth session', async () => {
  const { user } = await createUserWithEmailAndPassword(auth, 'session-member@example.com', 'Example123!')
  const api = createSessionService({ auth })
  await signOut(auth)
  await assert.rejects(api.login({ email: 'session-member@example.com', password: 'WrongPassword!' }))
  assert.equal(auth.currentUser, null)
  const loggedIn = await api.login({ email: '  session-member@example.com  ', password: 'Example123!' })
  assert.equal(loggedIn.uid, user.uid)
  assert.equal(auth.currentUser.uid, user.uid)
  await api.logout()
  assert.equal(auth.currentUser, null)
})

test('admin role requires server permission, forged frontend UID cannot elevate a member', async () => {
  const admin = {uid:'test-admin'}
  const member = {uid:'test-member'}
  assert.equal(await resolveAccountRole({user:admin,adminUid:'test-admin',db:env.authenticatedContext(admin.uid).firestore()}),'admin')
  assert.equal(await resolveAccountRole({user:member,adminUid:member.uid,db:env.authenticatedContext(member.uid).firestore()}),'member')
})
