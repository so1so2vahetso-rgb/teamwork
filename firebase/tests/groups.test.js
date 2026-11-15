import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { createGroupRepository } from '../../src/features/groups/groupRepository.js'

if (!process.env.FIRESTORE_EMULATOR_HOST) throw Error('Use npm run test:rules; never target production.')
const adminUid='test-admin'
let env, adminDb, memberDb, repo, groupId
before(async () => {
  const rules=readFileSync('firebase/firestore.rules','utf8').replace(/return request\.auth != null && request\.auth\.uid == '[^']*';/, `return request.auth != null && request.auth.uid == '${adminUid}';`)
  env=await initializeTestEnvironment({projectId:'demo-teamwork',firestore:{host:'127.0.0.1',port:8080,rules}})
  adminDb=env.authenticatedContext(adminUid).firestore()
  memberDb=env.authenticatedContext('test-member').firestore()
  repo=createGroupRepository({db:adminDb,auth:{currentUser:{uid:adminUid}}})
})
after(async () => env?.cleanup())
const groupData=(extra={})=>({name:'Nhóm A',description:'Đồ án',archived:false,version:1,createdBy:adminUid,updatedBy:adminUid,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),...extra})

test('admin creates group and matching immutable audit in one transaction',async()=>{
  groupId=await repo.create({name:'  Nhóm A  ',description:'  Đồ án  '})
  const data=(await getDoc(doc(adminDb,'groups',groupId))).data()
  assert.equal(data.name,'Nhóm A');assert.equal(data.description,'Đồ án');assert.equal(data.version,1);assert.equal(data.archived,false)
  const log=(await getDoc(doc(adminDb,'activityLogs',`group_${groupId}_1`))).data()
  assert.equal(log.action,'created');assert.equal(log.actorId,adminUid);assert.equal(log.name,'Nhóm A')
})
test('member and anonymous cannot read or change groups or read audit',async()=>{
  const anon=env.unauthenticatedContext().firestore()
  for(const db of [memberDb,anon]){
    await assertFails(getDoc(doc(db,'groups',groupId)))
    await assertFails(getDocs(collection(db,'groups')))
    await assertFails(setDoc(doc(db,'groups','unauthorized'),groupData()))
    await assertFails(updateDoc(doc(db,'groups',groupId),{name:'Hacked'}))
    await assertFails(getDoc(doc(db,'activityLogs',`group_${groupId}_1`)))
  }
})
test('group writes without audit, forged standalone audit, edits and deletion of audit are denied',async()=>{
  await assertFails(setDoc(doc(adminDb,'groups','no-audit'),groupData()))
  await assertFails(updateDoc(doc(adminDb,'groups',groupId),{name:'No audit',version:2,updatedBy:adminUid,updatedAt:serverTimestamp()}))
  await assertFails(setDoc(doc(adminDb,'activityLogs','group_fake_1'),{entityType:'group',entityId:'fake',version:1,action:'created',actorId:adminUid,name:'Fake',createdAt:serverTimestamp()}))
  await assertFails(updateDoc(doc(adminDb,'activityLogs',`group_${groupId}_1`),{action:'archived'}))
  await assertFails(deleteDoc(doc(adminDb,'activityLogs',`group_${groupId}_1`)))
})
test('updates detect stale versions and archive is soft with history retained',async()=>{
  await repo.update(groupId,{name:'Nhóm A mới',description:'Mô tả mới'},1)
  await assert.rejects(repo.update(groupId,{name:'Ghi đè',description:''},1),{code:'groups/conflict'})
  await repo.archive(groupId,2)
  const archived=(await getDoc(doc(adminDb,'groups',groupId))).data()
  assert.equal(archived.archived,true);assert.equal(archived.version,3)
  assert.equal((await getDoc(doc(adminDb,'activityLogs',`group_${groupId}_3`))).data().action,'archived')
  await assert.rejects(repo.update(groupId,{name:'Mở lại',description:''},3),{code:'groups/archived'})
  await assertFails(deleteDoc(doc(adminDb,'groups',groupId)))
})
test('server rejects invalid group input even with a matching audit batch',async()=>{
  for(const [index,patch] of [{name:'   '},{name:'x'.repeat(81)},{description:'x'.repeat(501)},{createdBy:'another-user'},{extra:'forbidden'}].entries()){
    const id=`invalid-group-${index}`,data=groupData(patch),batch=writeBatch(adminDb)
    batch.set(doc(adminDb,'groups',id),data)
    batch.set(doc(adminDb,'activityLogs',`group_${id}_1`),{entityType:'group',entityId:id,version:1,action:'created',actorId:adminUid,name:data.name,createdAt:serverTimestamp()})
    await assertFails(batch.commit())
  }
})
