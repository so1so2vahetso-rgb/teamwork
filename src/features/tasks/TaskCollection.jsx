import {useEffect,useState} from 'react'
import {Archive,CalendarDays,LayoutGrid,List,Pencil,Search,UserRound} from 'lucide-react'
import {filterTasks,isOverdue,statusLabels,summarizeTasks} from './taskViewModel.js'
import {taskErrorMessage} from './taskErrors.js'

export default function TaskCollection({tasks,user,isAdmin,repository,canChange,onEdit,onArchive,showGroup=false}){
 const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[assignee,setAssignee]=useState(''),[overdue,setOverdue]=useState(false),[view,setView]=useState('board')
 const [pending,setPending]=useState(null),[error,setError]=useState(''),[now,setNow]=useState(new Date())
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[])
 const filtered=filterTasks(tasks,{search,status,assignee,onlyOverdue:overdue},now),stats=summarizeTasks(filtered)
 const people=[...new Map(tasks.map(task=>[task.assigneeId,task.assigneeName])).entries()]
 async function change(task,value){
  if(pending||!canChange||!navigator.onLine)return
  setPending(`${task.groupId}/${task.id}`);setError('')
  try{await repository.setStatus(task.groupId,task.id,value,task.version)}catch(error){setError(taskErrorMessage(error))}finally{setPending(null)}
 }
 const card=task=><article className="task-card" key={`${task.groupId}/${task.id}`}>
  <div className="task-card-status"><span className={`task-status task-status-${task.status}`}>{statusLabels[task.status]}</span>{isOverdue(task,now)&&<span className="overdue-badge">Quá hạn</span>}</div>
  {showGroup&&<span className="task-group-label">{task.groupName}</span>}<h3>{task.title}</h3><p className="task-description">{task.description||'Chưa có mô tả.'}</p>
  <div className="task-card-meta"><span><UserRound size={15}/>{task.assigneeName}</span><span><CalendarDays size={15}/>Hạn {task.dueDate.split('-').reverse().join('/')}</span></div>
  {(isAdmin||task.assigneeId===user.uid)?<label className="task-status-control">Cập nhật trạng thái<select aria-label={`Trạng thái ${task.title}`} value={task.status} disabled={!canChange||!!pending} onChange={event=>change(task,event.target.value)}>{Object.entries(statusLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>:<p className="task-readonly">Chỉ người phụ trách được cập nhật.</p>}
  {isAdmin&&onEdit&&<div className="group-card-actions"><button className="group-secondary" type="button" disabled={!canChange||!!pending} onClick={()=>onEdit(task)} aria-label={`Chỉnh sửa công việc ${task.title}`}><Pencil size={15}/>Chỉnh sửa</button><button className="group-archive" type="button" disabled={!canChange||!!pending} onClick={()=>onArchive(task)} aria-label={`Lưu trữ công việc ${task.title}`}><Archive size={15}/>Lưu trữ</button></div>}
 </article>
 return <>
  <div className="task-summary" aria-label="Thống kê phạm vi đang lọc"><div><span>Tổng công việc</span><strong>{stats.total}</strong></div><div><span>Đang làm</span><strong>{stats.doing}</strong></div><div><span>Hoàn thành</span><strong>{stats.done}<small> / {stats.total}</small></strong></div><div><span>Tiến độ</span><strong>{stats.percent}%</strong><div className="completion-track"><span style={{width:`${stats.percent}%`}}/></div></div></div>
  <div className="task-filters"><label className="task-search"><Search size={17}/><input aria-label="Tìm công việc" placeholder="Tìm theo tên công việc…" value={search} onChange={event=>setSearch(event.target.value)}/></label><label>Người phụ trách<select aria-label="Lọc người phụ trách" value={assignee} onChange={event=>setAssignee(event.target.value)}><option value="">Tất cả</option>{people.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>Trạng thái<select aria-label="Lọc trạng thái" value={status} onChange={event=>setStatus(event.target.value)}><option value="">Tất cả</option>{Object.entries(statusLabels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label className="overdue-filter"><input type="checkbox" checked={overdue} onChange={event=>setOverdue(event.target.checked)}/>Chỉ quá hạn</label></div>
  <div className="task-view-heading"><span>{filtered.length} công việc trong phạm vi lọc</span><div className="task-view-buttons"><button type="button" aria-pressed={view==='board'} onClick={()=>setView('board')}><LayoutGrid size={15}/>Bảng trạng thái</button><button type="button" aria-pressed={view==='list'} onClick={()=>setView('list')}><List size={15}/>Danh sách</button></div></div>
  {error&&<p className="form-notice error" role="alert">{error}</p>}
  {tasks.length>0&&filtered.length===0?<p className="task-no-results">Không có công việc phù hợp bộ lọc.</p>:view==='board'?<div className="task-board">{Object.entries(statusLabels).map(([id,label])=><section className={`task-column column-${id}`} key={id}><header><h2>{label}</h2><span>{filtered.filter(task=>task.status===id).length}</span></header><div>{filtered.filter(task=>task.status===id).map(card)}{filtered.filter(task=>task.status===id).length===0&&<p className="task-column-empty">Chưa có công việc</p>}</div></section>)}</div>:<div className="tasks-grid">{filtered.map(card)}</div>}
 </>
}
