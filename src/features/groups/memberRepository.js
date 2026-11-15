import { collection, doc, getDocs, query, where, limit, runTransaction, serverTimestamp, onSnapshot } from 'firebase/firestore'

const fail = code => Object.assign(new Error(code), {code})

export function createMemberRepository({db,auth}) {
  async function findByEmail(email) {
    const result=await getDocs(query(collection(db,'users'),where('email','==',email.trim().toLowerCase()),limit(5)))
    return result.docs.map(doc=>({uid:doc.id,...doc.data()}))
  }
  async function change(groupId,uid,active,expectedVersion) {
    const actorId=auth.currentUser?.uid
    if(!actorId)throw fail('groups/no-session')
    const ref=doc(db,'groups',groupId,'members',uid)
    await runTransaction(db,async tx=>{
      const [group,account,current]=await Promise.all([tx.get(doc(db,'groups',groupId)),tx.get(doc(db,'users',uid)),tx.get(ref)])
      if(!group.exists())throw fail('groups/not-found')
      if(group.data().archived)throw fail('groups/archived')
      if(!account.exists())throw fail('members/account-not-found')
      const previous=current.data()
      if(active&&previous?.active)throw fail('members/already-joined')
      if(!active&&(!previous?.active||previous.version!==expectedVersion))throw fail('members/conflict')
      if(previous?.openTaskCount>0)throw fail('members/has-open-tasks')
      const version=(previous?.version??0)+1
      const data={groupId,uid,displayName:account.data().displayName,active,version,openTaskCount:0,joinedAt:active?serverTimestamp():previous.joinedAt,updatedAt:serverTimestamp(),updatedBy:actorId}
      tx.set(ref,data)
      tx.set(doc(db,'users',uid,'groupRefs',groupId),{groupId,uid,active,version})
      tx.set(doc(db,'activityLogs',`member_${groupId}_${uid}_${version}`),{entityType:'membership',groupId,uid,version,action:active?'added':'removed',actorId,name:data.displayName,groupName:group.data().name,createdAt:serverTimestamp()})
    })
  }
  function watchMembers(groupId,onData,onError) {
    return onSnapshot(query(collection(db,'groups',groupId,'members'),where('active','==',true)),{includeMetadataChanges:true},snapshot=>{
      onData({members:snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).sort((a,b)=>a.displayName.localeCompare(b.displayName,'vi')),serverConfirmed:!snapshot.metadata.fromCache&&!snapshot.metadata.hasPendingWrites})
    },onError)
  }
  function watchMyGroups(uid,onData,onError) {
    const subscribers=new Map(),data=new Map()
    let active=true
    const publish=()=>{if(active)onData([...data.values()].sort((a,b)=>a.name.localeCompare(b.name,'vi')))}
    const refs=onSnapshot(query(collection(db,'users',uid,'groupRefs'),where('active','==',true)),snapshot=>{
      if(!active)return
      const ids=new Set(snapshot.docs.map(doc=>doc.id))
      for(const [id,unsubscribe]of subscribers)if(!ids.has(id)){unsubscribe();subscribers.delete(id);data.delete(id)}
      for(const id of ids)if(!subscribers.has(id)){
        subscribers.set(id,onSnapshot(doc(db,'groups',id),group=>{
          if(!active)return
          if(group.exists()&&!group.data().archived)data.set(id,{id,...group.data()});else data.delete(id)
          publish()
        },error=>{subscribers.delete(id);data.delete(id);publish();if(error.code!=='permission-denied'&&active)onError(error)}))
      }
      publish()
    },error=>{for(const stop of subscribers.values())stop();subscribers.clear();data.clear();publish();if(active)onError(error)})
    return()=>{active=false;refs();for(const stop of subscribers.values())stop();subscribers.clear()}
  }
  return {findByEmail,add:(groupId,uid)=>change(groupId,uid,true),remove:(groupId,uid,version)=>change(groupId,uid,false,version),watchMembers,watchMyGroups}
}
