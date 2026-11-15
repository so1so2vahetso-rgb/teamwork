import {collection,doc,getDoc,getDocs,query,orderBy,limit,startAfter} from 'firebase/firestore'
export function createActivityRepository({db}){
 async function list(cursor=null){
  const constraints=[orderBy('createdAt','desc'),orderBy('__name__','desc'),limit(25)]
  if(cursor)constraints.push(startAfter(cursor))
  const snapshot=await getDocs(query(collection(db,'activityLogs'),...constraints))
  return{items:snapshot.docs.map(doc=>({id:doc.id,...doc.data()})),cursor:snapshot.docs.length===25?snapshot.docs.at(-1):null}
 }
 async function actorNames(ids){
  const pairs=await Promise.all([...new Set(ids)].map(async id=>{const profile=await getDoc(doc(db,'users',id));return[id,profile.data()?.displayName??'Tài khoản đã xóa']}))
  return Object.fromEntries(pairs)
 }
 return{list,actorNames}
}
