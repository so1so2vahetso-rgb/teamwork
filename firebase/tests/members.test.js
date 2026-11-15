import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, collection, query, where, setDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { createGroupRepository } from '../../src/features/groups/groupRepository.js'
import { createMemberRepository } from '../../src/features/groups/memberRepository.js'

if (!process.env.FIRESTORE_EMULATOR_HOST) throw Error('Use npm run test:rules')
let env,db,repo,groups,a,b,memberDb
before(async()=>{
  const rules=readFileSync('firebase/firestore.rules','utf8').replace(/return request\.auth != null && request\.auth\.uid == '[^']*';/,"return request.auth != null && request.auth.uid == 'test-admin';")
  env=await initializeTestEnvironment({projectId:'demo-teamwork',firestore:{host:'127.0.0.1',port:8080,rules}})
  db=env.authenticatedContext('test-admin').firestore();memberDb=env.authenticatedContext('member-one',{email:'member-one@example.com'}).firestore()
  await env.withSecurityRulesDisabled(async ctx=>{
    for(const uid of ['member-one','member-two'])await setDoc(doc(ctx.firestore(),'users',uid),{uid,email:`${uid}@example.com`,displayName:uid,role:'member',createdAt:serverTimestamp()})
  })
  const auth={currentUser:{uid:'test-admin'}};repo=createMemberRepository({db,auth});groups=createGroupRepository({db,auth})
  a=await groups.create({name:'Membership A',description:''});b=await groups.create({name:'Membership B',description:''})
})
after(async()=>env?.cleanup())
test('admin finds registered account, adds same person to two groups with private refs and audit',async()=>{
  const result=await repo.findByEmail('member-one@example.com');assert.equal(result[0].uid,'member-one')
  await repo.add(a,'member-one');await repo.add(b,'member-one');await repo.add(a,'member-two')
  const data=(await getDoc(doc(db,'groups',a,'members','member-one'))).data()
  assert.equal(data.active,true);assert.equal(data.openTaskCount,0);assert.ok(!('email' in data))
  assert.equal((await getDoc(doc(memberDb,'users','member-one','groupRefs',a))).data().active,true)
  assert.equal((await getDoc(doc(db,'activityLogs',`member_${a}_member-one_1`))).data().action,'added')
})
test('member reads joined groups and public names, not outsider groups or personal emails',async()=>{
  assert.equal((await getDoc(doc(memberDb,'groups',a))).exists(),true)
  assert.equal((await getDocs(query(collection(memberDb,'groups',a,'members'),where('active','==',true)))).size,2)
  await assertFails(getDoc(doc(memberDb,'users','member-two')))
  await assertFails(getDocs(collection(memberDb,'users')))
  const outsider=env.authenticatedContext('outsider').firestore()
  await assertFails(getDoc(doc(outsider,'groups',a)))
  await assertFails(getDocs(collection(outsider,'groups',a,'members')))
})
test('admin can remove and re-add; revocation blocks group access and audit versions stay intact',async()=>{
  await repo.remove(a,'member-one',1)
  await assertFails(getDoc(doc(memberDb,'groups',a)))
  assert.equal((await getDoc(doc(memberDb,'groups',b))).exists(),true)
  assert.equal((await getDocs(query(collection(memberDb,'users','member-one','groupRefs'),where('active','==',true)))).size,1)
  await repo.add(a,'member-one')
  assert.equal((await getDoc(doc(memberDb,'groups',a))).exists(),true)
  assert.equal((await getDoc(doc(db,'groups',a,'members','member-one'))).data().version,3)
  assert.equal((await getDoc(doc(db,'activityLogs',`member_${a}_member-one_2`))).data().action,'removed')
})
test('duplicate/unregistered/stale operations rejected and archived groups cannot gain members',async()=>{
  await assert.rejects(repo.add(a,'member-one'),{code:'members/already-joined'})
  await assert.rejects(repo.add(a,'missing-account'),{code:'members/account-not-found'})
  await assert.rejects(repo.remove(a,'member-one',1),{code:'members/conflict'})
  await groups.archive(b,1)
  await assertFails(getDoc(doc(memberDb,'groups',b)))
  await assert.rejects(repo.add(b,'member-two'),{code:'groups/archived'})
})
test('direct writes cannot bypass membership, personal refs, audit or admin-only mutations',async()=>{
  await assertFails(updateDoc(doc(memberDb,'groups',a,'members','member-one'),{active:false}))
  await assertFails(setDoc(doc(memberDb,'users','member-one','groupRefs','fake'),{active:true}))
  await assertFails(updateDoc(doc(db,'groups',a,'members','member-one'),{active:false,version:4,updatedAt:serverTimestamp(),updatedBy:'test-admin'}))
  await assertFails(setDoc(doc(db,'users','member-two','groupRefs','fake'),{groupId:'fake',uid:'member-two',active:true,version:1}))
})
test('removal with unfinished work is blocked even when repository is bypassed',async()=>{
  await env.withSecurityRulesDisabled(ctx=>updateDoc(doc(ctx.firestore(),'groups',a,'members','member-one'),{openTaskCount:1}))
  await assert.rejects(repo.remove(a,'member-one',3),{code:'members/has-open-tasks'})
  const previous=(await getDoc(doc(db,'groups',a,'members','member-one'))).data();const batch=writeBatch(db)
  batch.set(doc(db,'groups',a,'members','member-one'),{...previous,active:false,version:4,updatedBy:'test-admin',updatedAt:serverTimestamp()})
  batch.set(doc(db,'users','member-one','groupRefs',a),{groupId:a,uid:'member-one',active:false,version:4})
  batch.set(doc(db,'activityLogs',`member_${a}_member-one_4`),{entityType:'membership',groupId:a,uid:'member-one',version:4,action:'removed',actorId:'test-admin',name:'member-one',groupName:'Membership A',createdAt:serverTimestamp()})
  await assertFails(batch.commit())
})
