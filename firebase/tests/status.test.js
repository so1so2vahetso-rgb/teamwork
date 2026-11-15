import {before,after,test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {initializeTestEnvironment,assertFails} from '@firebase/rules-unit-testing'
import {doc,getDoc,setDoc,serverTimestamp,getDocs,collection,query,where} from 'firebase/firestore'
import {createGroupRepository} from '../../src/features/groups/groupRepository.js'
import {createMemberRepository} from '../../src/features/groups/memberRepository.js'
import {createTaskRepository} from '../../src/features/tasks/taskRepository.js'
let env,db,memberDb,anTasks,adminTasks,members,g,a,b
if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator only')
before(async()=>{
 const rules=readFileSync('firebase/firestore.rules','utf8').replace(/return request\.auth != null && request\.auth\.uid == '[^']*';/,"return request.auth != null && request.auth.uid == 'test-admin';")
 env=await initializeTestEnvironment({projectId:'demo-teamwork',firestore:{host:'127.0.0.1',port:8080,rules}})
 db=env.authenticatedContext('test-admin').firestore();memberDb=env.authenticatedContext('status-an').firestore()
 await env.withSecurityRulesDisabled(async ctx=>{for(const uid of ['status-an','status-binh'])await setDoc(doc(ctx.firestore(),'users',uid),{uid,email:`${uid}@example.com`,displayName:uid,role:'member',createdAt:serverTimestamp()})})
 const clients={db,auth:{currentUser:{uid:'test-admin'}}};adminTasks=createTaskRepository(clients);members=createMemberRepository(clients)
 g=await createGroupRepository(clients).create({name:'Status team',description:''});await members.add(g,'status-an');await members.add(g,'status-binh')
 a=await adminTasks.create(g,{title:'An làm',description:'',assigneeId:'status-an',dueDate:'2026-11-20'})
 b=await adminTasks.create(g,{title:'Bình làm',description:'',assigneeId:'status-binh',dueDate:'2026-11-20'})
 anTasks=createTaskRepository({db:memberDb,auth:{currentUser:{uid:'status-an'}}})
})
after(async()=>env?.cleanup())
test('assignee changes all three states, completion immediate, reverse restores counter and audit',async()=>{
 await anTasks.setStatus(g,a,'doing',1);await anTasks.setStatus(g,a,'done',2)
 assert.equal((await getDoc(doc(db,'groups',g,'members','status-an'))).data().openTaskCount,0)
 assert.equal((await getDoc(doc(db,'groups',g,'tasks',a))).data().status,'done')
 const log=(await getDoc(doc(db,'activityLogs',`task_${g}_${a}_3`))).data();assert.equal(log.fromStatus,'doing');assert.equal(log.toStatus,'done');assert.equal(log.actorId,'status-an')
 await anTasks.setStatus(g,a,'todo',3)
 assert.equal((await getDoc(doc(db,'groups',g,'members','status-an'))).data().openTaskCount,1)
 await assert.rejects(anTasks.setStatus(g,a,'done',3),{code:'tasks/conflict'})
})
test('member cannot change another assignee task, content, archive, audit or invalid status',async()=>{
 await assert.rejects(anTasks.setStatus(g,b,'done',1))
 await assert.rejects(anTasks.update(g,a,{title:'Hacked',description:'',assigneeId:'status-an',dueDate:'2026-11-20'},4))
 await assert.rejects(anTasks.archive(g,a,4))
 await assert.rejects(anTasks.setStatus(g,a,'bad',4))
 await assertFails(getDocs(query(collection(memberDb,'activityLogs'),where('actorId','==','status-an'))))
})
test('completed member can leave, admin retains history and must reassign before reopening',async()=>{
 await anTasks.setStatus(g,a,'done',4);await members.remove(g,'status-an',1)
 await assert.rejects(anTasks.setStatus(g,a,'todo',5))
 await assert.rejects(adminTasks.setStatus(g,a,'todo',5))
 await adminTasks.update(g,a,{title:'An làm',description:'',assigneeId:'status-binh',dueDate:'2026-11-20'},5)
 await adminTasks.setStatus(g,a,'doing',6)
 assert.equal((await getDoc(doc(db,'groups',g,'members','status-binh'))).data().openTaskCount,2)
})
