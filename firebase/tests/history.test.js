import {before,after,test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {initializeTestEnvironment} from '@firebase/rules-unit-testing'
import {doc,setDoc,Timestamp} from 'firebase/firestore'
import {createActivityRepository} from '../../src/features/activity/activityRepository.js'
if(!process.env.FIRESTORE_EMULATOR_HOST)throw Error('Emulator only')
let env,db
before(async()=>{
 const rules=readFileSync('firebase/firestore.rules','utf8').replace(/return request\.auth != null && request\.auth\.uid == '[^']*';/,"return request.auth != null && request.auth.uid == 'test-admin';")
 env=await initializeTestEnvironment({projectId:'demo-teamwork',firestore:{host:'127.0.0.1',port:8080,rules}})
 await env.clearFirestore()
 await env.withSecurityRulesDisabled(async ctx=>{for(let i=0;i<30;i++)await setDoc(doc(ctx.firestore(),'activityLogs',`history-${String(i).padStart(2,'0')}`),{actorId:'test-admin',name:`Event ${i}`,createdAt:Timestamp.fromMillis(100000+i*1000)})})
 db=env.authenticatedContext('test-admin').firestore()
})
after(async()=>env?.cleanup())
test('admin history paginates newest first without duplicates, member cannot request history',async()=>{
 const repo=createActivityRepository({db}),first=await repo.list(),second=await repo.list(first.cursor)
 assert.equal(first.items.length,25);assert.equal(second.items.length,5);assert.equal(second.cursor,null)
 assert.equal(first.items[0].name,'Event 29');assert.equal(second.items.at(-1).name,'Event 0')
 assert.equal(new Set([...first.items,...second.items].map(item=>item.id)).size,30)
 await assert.rejects(createActivityRepository({db:env.authenticatedContext('history-member').firestore()}).list(),{code:'permission-denied'})
})
