import {useEffect,useRef,useState} from 'react'
import {RefreshCw,History,ChevronDown} from 'lucide-react'
import {getFirebaseClients,configuredAdminUid} from '../../lib/firebase.js'
import {resolveAccountRole} from '../auth/sessionService.js'
import {createActivityRepository} from './activityRepository.js'
import {statusLabels} from '../tasks/taskViewModel.js'
import {groupErrorMessage} from '../groups/groupErrors.js'
import './activity.css'

const actions={created:'đã tạo',updated:'đã chỉnh sửa',archived:'đã lưu trữ',added:'đã thêm thành viên',removed:'đã xóa thành viên',status_changed:'đã đổi trạng thái'}
const date=value=>value?.toDate?new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'short'}).format(value.toDate()):'Đang cập nhật'
export default function ActivityPage({user}){
 const [items,setItems]=useState([]),[names,setNames]=useState({}),[cursor,setCursor]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const alive=useRef(true),lock=useRef(false),repo=useRef(null)
 async function load(more=false){
  if(lock.current)return;lock.current=true;setBusy(true);setError('')
  try{
   if(!repo.current){const clients=await getFirebaseClients();if(await resolveAccountRole({...clients,user,adminUid:configuredAdminUid})!=='admin')throw Object.assign(new Error('Denied'),{code:'permission-denied'});repo.current=createActivityRepository(clients)}
   const page=await repo.current.list(more?cursor:null),people=await repo.current.actorNames(page.items.map(item=>item.actorId))
   if(alive.current){setItems(previous=>more?[...previous,...page.items.filter(item=>!previous.some(old=>old.id===item.id))]:page.items);setNames(previous=>({...previous,...people}));setCursor(page.cursor)}
  }catch(error){if(alive.current){setError(groupErrorMessage(error));if(error.code==='permission-denied'){setItems([]);setCursor(null)}}}finally{lock.current=false;if(alive.current)setBusy(false)}
 }
 useEffect(()=>{alive.current=true;document.title='Lịch sử hoạt động · TeamWork';load();return()=>{alive.current=false}},[])
 return <section><header className="groups-heading"><div><span className="groups-eyebrow">CHỈ DÀNH CHO ADMIN</span><h1>Lịch sử hoạt động<span>.</span></h1><p>Theo dõi các thay đổi trong nhóm, thành viên và công việc.</p></div><button type="button" className="group-secondary" disabled={busy} onClick={()=>load()}><RefreshCw size={16}/>Làm mới</button></header>
  {error&&<p role="alert" className="form-notice error">{error}</p>}
  <div className="activity-list">{items.map(item=><article className="activity-item" key={item.id}><span className="activity-icon"><History size={17}/></span><div><p><strong>{item.actorId===configuredAdminUid?'Admin':names[item.actorId]??'Thành viên'}</strong> {actions[item.action]??'đã cập nhật'} <strong>{item.name}</strong>{item.groupName?` · ${item.groupName}`:''}</p><time>{date(item.createdAt)}</time>{item.action==='status_changed'&&<p className="activity-status">{statusLabels[item.fromStatus]??item.fromStatus} → {statusLabels[item.toStatus]??item.toStatus}</p>}{item.entityType==='task'&&<details><summary>Chi tiết công việc</summary><p>Phụ trách: {item.assigneeName} · Hạn {item.dueDate?.split('-').reverse().join('/')}</p>{item.previousAssigneeId&&item.previousAssigneeId!==item.assigneeId&&<p>Giao lại từ {item.previousAssigneeName} sang {item.assigneeName}</p>}</details>}</div></article>)}</div>
  {busy&&<p className="groups-loading" role="status">Đang tải lịch sử…</p>}{!busy&&!error&&items.length===0&&<div className="groups-empty"><h2>Chưa có hoạt động</h2><p>Các thao tác quản lý và cập nhật công việc sẽ được ghi tại đây.</p></div>}{cursor&&<button className="group-secondary activity-more" type="button" disabled={busy} onClick={()=>load(true)}><ChevronDown size={16}/>Xem thêm</button>}
 </section>
}
