import {collection,doc,runTransaction,serverTimestamp,onSnapshot,query,where} from 'firebase/firestore'

const fail=code=>Object.assign(new Error(code),{code})
function normalize(input){
 if(typeof input.title!=='string'||typeof input.description!=='string'||typeof input.assigneeId!=='string'||typeof input.dueDate!=='string')throw fail('tasks/invalid-input')
 const fields={title:input.title.trim(),description:input.description.trim(),assigneeId:input.assigneeId.trim(),dueDate:input.dueDate}
 if(!fields.title||fields.title.length>120||fields.description.length>2000||!fields.assigneeId||!/^\d{4}-\d{2}-\d{2}$/.test(fields.dueDate))throw fail('tasks/invalid-input')
 const date=new Date(`${fields.dueDate}T00:00:00Z`)
 if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==fields.dueDate||fields.dueDate.startsWith('0000'))throw fail('tasks/invalid-date')
 return fields
}
const contribution=(task,uid)=>task&&!task.archived&&task.status!=='done'&&task.assigneeId===uid?1:0

export function createTaskRepository({db,auth}){
 async function save(groupId,taskId,input,expectedVersion,archive,nextStatus){
  const statusOnly=nextStatus!==undefined
  if(statusOnly&&!['todo','doing','done'].includes(nextStatus))throw fail('tasks/invalid-status')
  const fields=archive||statusOnly?null:normalize(input),actorId=auth.currentUser?.uid
  if(!actorId)throw fail('groups/no-session')
  const ref=taskId?doc(db,'groups',groupId,'tasks',taskId):doc(collection(db,'groups',groupId,'tasks'))
  await runTransaction(db,async tx=>{
   const [group,snapshot]=await Promise.all([tx.get(doc(db,'groups',groupId)),tx.get(ref)])
   if(!group.exists())throw fail('groups/not-found')
   if(group.data().archived)throw fail('groups/archived')
   const previous=snapshot.data()
   if(taskId&&!previous)throw fail('tasks/not-found')
   if(previous?.archived)throw fail('tasks/archived')
   if(previous&&previous.version!==expectedVersion)throw fail('tasks/conflict')
   if(statusOnly&&previous.status===nextStatus)return
   const assigneeId=archive||statusOnly?previous.assigneeId:fields.assigneeId
   const ids=[...new Set([previous?.assigneeId,assigneeId].filter(Boolean))]
   const memberships=await Promise.all(ids.map(async uid=>({uid,ref:doc(db,'groups',groupId,'members',uid),snapshot:await tx.get(doc(db,'groups',groupId,'members',uid))})))
   const assigned=memberships.find(member=>member.uid===assigneeId)?.snapshot.data()
   if(!assigned||(!archive&&!assigned.active))throw fail('tasks/invalid-assignee')
   const data=previous?{...previous,...(fields??{}),assigneeName:archive||statusOnly?previous.assigneeName:assigned.displayName,status:statusOnly?nextStatus:previous.status,archived:archive,version:previous.version+1,updatedAt:serverTimestamp(),updatedBy:actorId}
    :{...fields,assigneeName:assigned.displayName,status:'todo',archived:false,version:1,createdAt:serverTimestamp(),createdBy:actorId,updatedAt:serverTimestamp(),updatedBy:actorId}
   const eventId=`task_${groupId}_${ref.id}_${data.version}`
   for(const member of memberships){
    const delta=contribution(data,member.uid)-contribution(previous,member.uid)
    if(delta){
     const old=member.snapshot.data()
     if(!old?.active||old.openTaskCount+delta<0)throw fail('tasks/invalid-assignee')
     tx.update(member.ref,{openTaskCount:old.openTaskCount+delta,lastTaskEvent:eventId})
    }
   }
   tx.set(ref,data)
   tx.set(doc(db,'activityLogs',eventId),{entityType:'task',groupId,entityId:ref.id,version:data.version,action:archive?'archived':statusOnly?'status_changed':previous?'updated':'created',actorId,name:data.title,assigneeId:data.assigneeId,assigneeName:data.assigneeName,dueDate:data.dueDate,previousAssigneeId:previous?.assigneeId??'',previousAssigneeName:previous?.assigneeName??'',fromStatus:previous?.status??'',toStatus:data.status,createdAt:serverTimestamp()})
  })
  return ref.id
 }
 function watch(groupId,onData,onError){
  return onSnapshot(query(collection(db,'groups',groupId,'tasks'),where('archived','==',false)),{includeMetadataChanges:true},snapshot=>onData({tasks:snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).sort((a,b)=>(b.createdAt?.toMillis()??0)-(a.createdAt?.toMillis()??0)),serverConfirmed:!snapshot.metadata.fromCache&&!snapshot.metadata.hasPendingWrites}),onError)
 }
 return {create:(groupId,input)=>save(groupId,null,input,null,false),update:(groupId,id,input,version)=>save(groupId,id,input,version,false),archive:(groupId,id,version)=>save(groupId,id,null,version,true),setStatus:(groupId,id,status,version)=>save(groupId,id,null,version,false,status),watch}
}
