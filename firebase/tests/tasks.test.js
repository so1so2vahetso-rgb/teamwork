import {before,after,test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing'
import {doc,getDoc,getDocs,collection,query,where,setDoc,updateDoc,deleteDoc,serverTimestamp,writeBatch} from 'firebase/firestore'
import {createGroupRepository} from '../../src/features/groups/groupRepository.js'
import {createMemberRepository} from '../../src/features/groups/memberRepository.js'
import {createTaskRepository} from '../../src/features/tasks/taskRepository.js'

if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Use npm run test:rules; no production')
let env,db,memberDb,outsiderDb,tasks,members,groups,groupId,taskId
const input={title:'Thiết kế đăng nhập',description:'Giao diện tiếng Việt',assigneeId:'task-an',dueDate:'2026-11-25'}
before(async()=>{
 const rules=readFileSync('firebase/firestore.rules','utf8').replace(/return request\.auth != null && request\.auth\.uid == '[^']*';/,"return request.auth != null && request.auth.uid == 'test-admin';")
 env=await initializeTestEnvironment({projectId:'demo-teamwork',firestore:{host:'127.0.0.1',port:8080,rules}})
 db=env.authenticatedContext('test-admin').firestore();memberDb=env.authenticatedContext('task-an').firestore();outsiderDb=env.authenticatedContext('task-outsider').firestore()
 await env.withSecurityRulesDisabled(async ctx=>{for(const uid of ['task-an','task-binh','task-outsider'])await setDoc(doc(ctx.firestore(),'users',uid),{uid,email:`${uid}@example.com`,displayName:uid,role:'member',createdAt:serverTimestamp()})})
 const clients={db,auth:{currentUser:{uid:'test-admin'}}};groups=createGroupRepository(clients);members=createMemberRepository(clients);tasks=createTaskRepository(clients)
 groupId=await groups.create({name:'Nhóm công việc',description:''});await members.add(groupId,'task-an');await members.add(groupId,'task-binh')
})
after(async()=>env?.cleanup())
async function count(uid){return(await getDoc(doc(db,'groups',groupId,'members',uid))).data().openTaskCount}

test('create assigns exactly one active member, server timestamps, todo and atomic audit/counter',async()=>{
 taskId=await tasks.create(groupId,{...input,title:'  Thiết kế đăng nhập  '})
 const task=(await getDoc(doc(db,'groups',groupId,'tasks',taskId))).data()
 assert.equal(task.title,'Thiết kế đăng nhập');assert.equal(task.assigneeId,'task-an');assert.equal(task.assigneeName,'task-an');assert.equal(task.status,'todo');assert.equal(task.version,1)
 assert.equal(await count('task-an'),1)
 assert.equal((await getDoc(doc(db,'activityLogs',`task_${groupId}_${taskId}_1`))).data().action,'created')
 await assert.rejects(members.remove(groupId,'task-an',1),{code:'members/has-open-tasks'})
})
test('members read all active tasks of own group but no write, outsider read or hard delete',async()=>{
 assert.equal((await getDocs(query(collection(memberDb,'groups',groupId,'tasks'),where('archived','==',false)))).size,1)
 await assertFails(getDoc(doc(outsiderDb,'groups',groupId,'tasks',taskId)))
 await assertFails(updateDoc(doc(memberDb,'groups',groupId,'tasks',taskId),{title:'Hacked'}))
 await assertFails(updateDoc(doc(memberDb,'groups',groupId,'tasks',taskId),{status:'done',version:2,updatedAt:serverTimestamp(),updatedBy:'task-an'}))
 await assertFails(deleteDoc(doc(db,'groups',groupId,'tasks',taskId)))
})
test('edit/reassign moves unfinished count and rejects stale writes without corrupting data',async()=>{
 await tasks.update(groupId,taskId,{...input,title:'Đăng nhập mới',assigneeId:'task-binh'},1)
 assert.equal(await count('task-an'),0);assert.equal(await count('task-binh'),1)
 await assert.rejects(tasks.update(groupId,taskId,input,1),{code:'tasks/conflict'})
 await tasks.update(groupId,taskId,{...input,title:'Sửa mô tả',assigneeId:'task-binh'},2)
 assert.equal(await count('task-binh'),1)
 await members.remove(groupId,'task-an',1)
 await assertFails(getDoc(doc(memberDb,'groups',groupId,'tasks',taskId)))
})
test('archive preserves document/history, releases count and prevents more edits',async()=>{
 await tasks.archive(groupId,taskId,3)
 assert.equal(await count('task-binh'),0)
 assert.equal((await getDoc(doc(db,'groups',groupId,'tasks',taskId))).data().archived,true)
 await assert.rejects(tasks.update(groupId,taskId,input,4),{code:'tasks/archived'})
 await members.remove(groupId,'task-binh',1)
})
test('invalid date/title/nonmember/array assignee and archived group are rejected',async()=>{
 for(const patch of [{dueDate:'2026-02-30'},{title:'   '},{assigneeId:'task-outsider'},{assigneeId:['task-an','task-binh']}])await assert.rejects(tasks.create(groupId,{...input,...patch}))
 await groups.archive(groupId,1)
 await assert.rejects(tasks.create(groupId,input),{code:'groups/archived'})
})
test('direct counter tampering or task writes without atomic log and counters are denied',async()=>{
 const id=await groups.create({name:'Kiểm tra ghi trực tiếp',description:''});await members.add(id,'task-an')
 const raw={...input,assigneeName:'task-an',status:'todo',version:1,archived:false,createdAt:serverTimestamp(),createdBy:'test-admin',updatedAt:serverTimestamp(),updatedBy:'test-admin'}
 const missingCounter=writeBatch(db)
 missingCounter.set(doc(db,'groups',id,'tasks','forged'),raw)
 missingCounter.set(doc(db,'activityLogs',`task_${id}_forged_1`),{entityType:'task',groupId:id,entityId:'forged',version:1,action:'created',actorId:'test-admin',name:raw.title,assigneeId:raw.assigneeId,assigneeName:raw.assigneeName,dueDate:raw.dueDate,previousAssigneeId:'',previousAssigneeName:'',fromStatus:'',toStatus:'todo',createdAt:serverTimestamp()})
 await assertFails(missingCounter.commit())
 const task=await tasks.create(id,input)
 const stored=(await getDoc(doc(db,'groups',id,'tasks',task))).data()
 await assertFails(updateDoc(doc(db,'groups',id,'members','task-an'),{openTaskCount:0,lastTaskEvent:`task_${id}_${task}_1`}))
 for(const patch of [{dueDate:'2026-02-30'},{title:'   '},{status:'done'}]){
  const batch=writeBatch(db),data={...stored,...patch,version:2,updatedAt:serverTimestamp()}
  batch.set(doc(db,'groups',id,'tasks',task),data)
  batch.set(doc(db,'activityLogs',`task_${id}_${task}_2`),{entityType:'task',groupId:id,entityId:task,version:2,action:data.status===stored.status?'updated':'status_changed',actorId:'test-admin',name:data.title,assigneeId:data.assigneeId,assigneeName:data.assigneeName,dueDate:data.dueDate,previousAssigneeId:stored.assigneeId,previousAssigneeName:stored.assigneeName,fromStatus:stored.status,toStatus:data.status,createdAt:serverTimestamp()})
  await assertFails(batch.commit())
 }
})
