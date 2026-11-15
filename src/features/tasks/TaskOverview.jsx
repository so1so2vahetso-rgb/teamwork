import {useEffect,useState} from 'react'
import {getFirebaseClients} from '../../lib/firebase.js'
import {createTaskRepository} from './taskRepository.js'
import {taskErrorMessage} from './taskErrors.js'
import TaskCollection from './TaskCollection.jsx'
import './tasks.css'

export default function TaskOverview({groups,user,isAdmin,mine=false,onOpenGroup}){
 const [data,setData]=useState({}),[repo,setRepo]=useState(null),[error,setError]=useState(''),[online,setOnline]=useState(navigator.onLine),[selected,setSelected]=useState('')
 const ids=groups.map(group=>group.id).sort().join(',')
 useEffect(()=>{if(selected&&!groups.some(group=>group.id===selected))setSelected('')},[ids,selected])
 useEffect(()=>{document.title=`${mine?'Công việc của tôi':'Tổng quan'} · TeamWork`;const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update)}},[mine])
 useEffect(()=>{
  let active=true;const stops=[];setData({});setError('')
  getFirebaseClients().then(clients=>{if(!active)return;const repository=createTaskRepository(clients);setRepo(repository)
   for(const group of groups)stops.push(repository.watch(group.id,snapshot=>{if(active)setData(previous=>{const copy={...previous};copy[group.id]=snapshot;return copy})},error=>{if(active){setData(previous=>{const copy={...previous};delete copy[group.id];return copy});setError(taskErrorMessage(error))}}))
  }).catch(error=>{if(active)setError(taskErrorMessage(error))})
  return()=>{active=false;stops.forEach(stop=>stop())}
 },[ids])
 const scope=groups.filter(group=>!selected||group.id===selected)
 const tasks=scope.flatMap(group=>(data[group.id]?.tasks??[]).map(task=>({...task,groupId:group.id,groupName:group.name}))).filter(task=>!mine||task.assigneeId===user.uid)
 const ready=scope.every(group=>data[group.id]?.serverConfirmed)
 return <section><header className="groups-heading"><div><span className="groups-eyebrow">MỖI NGƯỜI MỘT VIỆC · CẢ NHÓM MỘT MỤC TIÊU</span><h1>{mine?'Công việc của tôi':'Tổng quan công việc'}<span>.</span></h1><p>{mine?'Những công việc được giao cho bạn trong các nhóm đang tham gia.':'Tiến độ chung của các nhóm trong không gian làm việc.'}</p></div></header>
  <div className="overview-group-filter"><label>Nhóm<select aria-label="Lọc nhóm" value={selected} onChange={event=>setSelected(event.target.value)}><option value="">Tất cả nhóm</option>{groups.map(group=><option key={group.id} value={group.id}>{group.name}</option>)}</select></label>{selected&&<button className="group-secondary" type="button" onClick={()=>onOpenGroup(selected)}>Mở nhóm này</button>}</div>
  {error&&<p className="form-notice error" role="alert">{error}</p>}{!online&&<p className="group-connection" role="status">Mất kết nối. Tạm khóa cập nhật trạng thái.</p>}
  {groups.length===0?<div className="groups-empty"><h2>{isAdmin?'Chưa có nhóm làm việc':'Bạn chưa tham gia nhóm nào'}</h2><p>{isAdmin?'Mở Nhóm làm việc để tạo nhóm và thêm thành viên.':'Admin sẽ thêm bạn vào nhóm để bắt đầu nhận công việc.'}</p></div>:<TaskCollection tasks={tasks} user={user} isAdmin={isAdmin} repository={repo} canChange={!!repo&&ready&&online&&!error} showGroup/>}
 </section>
}
