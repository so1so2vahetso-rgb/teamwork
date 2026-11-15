import {useEffect,useState} from 'react'
import {ArrowLeft,Plus,UsersRound,WifiOff} from 'lucide-react'
import {getFirebaseClients} from '../../lib/firebase.js'
import {createTaskRepository} from './taskRepository.js'
import {createMemberRepository} from '../groups/memberRepository.js'
import {taskErrorMessage} from './taskErrors.js'
import TaskDialog from './TaskDialog.jsx'
import TaskCollection from './TaskCollection.jsx'
import './tasks.css'

export default function TasksPage({group,user,isAdmin,onBack,onMembers}){
 const [repo,setRepo]=useState(null),[tasks,setTasks]=useState([]),[members,setMembers]=useState([])
 const [loading,setLoading]=useState(true),[tasksConfirmed,setTasksConfirmed]=useState(false),[membersConfirmed,setMembersConfirmed]=useState(false)
 const [online,setOnline]=useState(navigator.onLine),[error,setError]=useState(''),[notice,setNotice]=useState(''),[dialog,setDialog]=useState(null),[refresh,setRefresh]=useState(0)
 useEffect(()=>{
  document.title=`${group.name} · Công việc · TeamWork`
  const update=()=>setOnline(navigator.onLine);window.addEventListener('online',update);window.addEventListener('offline',update)
  return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update)}
 },[group.name])
 useEffect(()=>{
  let active=true,stopTasks,stopMembers
  setError('');setLoading(true);setTasks([]);setTasksConfirmed(false);setMembersConfirmed(false)
  const onError=error=>{if(active){setError(taskErrorMessage(error));setTasks([]);setMembers([]);setLoading(false);setDialog(null);setTasksConfirmed(false);setMembersConfirmed(false)}}
  getFirebaseClients().then(clients=>{
   if(!active)return
   const repository=createTaskRepository(clients);setRepo(repository)
   stopTasks=repository.watch(group.id,({tasks,serverConfirmed})=>{if(active){setTasks(tasks);setTasksConfirmed(serverConfirmed);setLoading(false)}},onError)
   stopMembers=createMemberRepository(clients).watchMembers(group.id,({members,serverConfirmed})=>{if(active){setMembers(members);setMembersConfirmed(serverConfirmed)}},onError)
  }).catch(onError)
  return()=>{active=false;stopTasks?.();stopMembers?.()}
 },[group.id,refresh])
 const canChange=!!repo&&online&&tasksConfirmed&&membersConfirmed&&!error
 const open=(action,task=null)=>{setNotice('');setDialog({action,task})}
 return <section className="tasks-page">
  <button type="button" className="task-back" onClick={onBack}><ArrowLeft size={17}/>Trở lại danh sách nhóm</button>
  <header className="groups-heading"><div><span className="groups-eyebrow">CÔNG VIỆC TRONG NHÓM</span><h1>{group.name}<span>.</span></h1><p>Mỗi công việc có một người phụ trách và hạn chót rõ ràng.</p></div><div className="task-header-actions"><button className="group-secondary" type="button" onClick={onMembers}><UsersRound size={16}/>Thành viên</button>{isAdmin&&<button className="group-primary" type="button" disabled={!canChange||members.length===0} onClick={()=>open('create')}><Plus size={17}/>Tạo công việc</button>}</div></header>
  {error&&<div className="group-error" role="alert"><span>{error}</span><button className="group-secondary" type="button" onClick={()=>setRefresh(value=>value+1)}>Tải lại</button></div>}
  {notice&&<p className="group-success" role="status">{notice}</p>}{!online&&<p className="group-connection" role="status"><WifiOff size={17}/>Mất kết nối. Các thao tác lưu tạm thời bị khóa.</p>}
  {isAdmin&&membersConfirmed&&members.length===0&&!error&&<p className="group-connection">Nhóm chưa có thành viên. Thêm thành viên trước khi tạo và giao công việc.</p>}
  {loading?<p role="status" className="groups-loading">Đang tải công việc…</p>:!error&&<TaskCollection tasks={tasks.map(task=>({...task,groupId:group.id}))} user={user} isAdmin={isAdmin} repository={repo} canChange={canChange} onEdit={isAdmin?task=>open('edit',task):null} onArchive={task=>open('archive',task)}/>}
  {dialog&&repo&&<TaskDialog key={`${dialog.action}-${dialog.task?.id??'new'}`} {...dialog} group={group} members={members} repository={repo} onClose={()=>setDialog(null)} onSaved={message=>{setDialog(null);setNotice(message)}}/>}
 </section>
}
