import {before,after,test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {initializeTestEnvironment} from '@firebase/rules-unit-testing'
import {doc,setDoc,Timestamp} from 'firebase/firestore'
import {createActivityRepository} from '../../src/features/activity/activityRepository.js'
import {getReportWeek} from '../../src/features/reports/progressReportModel.js'
import {loadProgressReport} from '../../src/features/reports/progressReportRepository.js'
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

test('progress report reads the selected group and week and preserves the admin-only history rule', async () => {
 const now = new Date('2026-11-24T12:00:00+07:00')
 const event = {entityType:'task', action:'status_changed', fromStatus:'doing', toStatus:'done', groupId:'alpha', entityId:'finished', name:'Finished in alpha'}
 const task = {title:'Task to review', archived:false, status:'todo', dueDate:'2026-11-23'}
 await env.withSecurityRulesDisabled(async context => {
  const fixture = context.firestore()
  await Promise.all([
   setDoc(doc(fixture,'activityLogs','report-alpha'), {...event, createdAt:Timestamp.fromDate(new Date('2026-11-23T00:00:00+07:00'))}),
   setDoc(doc(fixture,'activityLogs','report-beta'), {...event, groupId:'beta', createdAt:Timestamp.fromDate(now)}),
   setDoc(doc(fixture,'activityLogs','report-old'), {...event, entityId:'old', createdAt:Timestamp.fromDate(new Date('2026-11-22T23:59:59+07:00'))}),
   setDoc(doc(fixture,'groups','alpha','tasks','open'), task),
   setDoc(doc(fixture,'groups','alpha','tasks','done'), {...task, status:'done'}),
   setDoc(doc(fixture,'groups','alpha','tasks','archived'), {...task, archived:true}),
   setDoc(doc(fixture,'groups','alpha','tasks','due-today'), {...task, dueDate:'2026-11-24'}),
   setDoc(doc(fixture,'groups','beta','tasks','open'), task),
  ])
 })
 const filters = {groupIds:['alpha'], week:getReportWeek(now), now}
 const report = await loadProgressReport(db, filters)
 assert.deepEqual(report.finished.map(item => item.entityId), ['finished'])
 assert.deepEqual(report.overdue.map(item => [item.groupId,item.id]), [['alpha','open']])
 const previous = await loadProgressReport(db, {...filters, week:getReportWeek(now, -1)})
 assert.deepEqual(previous.finished.map(item => item.entityId), ['old'])
 assert.equal(previous.overdue.length, 1)
 await assert.rejects(loadProgressReport(env.authenticatedContext('history-member').firestore(),filters), {code:'permission-denied'})
})
