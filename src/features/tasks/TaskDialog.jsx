import {useEffect,useRef,useState} from 'react'
import {X} from 'lucide-react'
import {taskErrorMessage} from './taskErrors.js'

export default function TaskDialog({group,task,action,members,repository,onClose,onSaved}){
 const dialog=useRef(null),lock=useRef(false)
 const [title,setTitle]=useState(task?.title??''),[description,setDescription]=useState(task?.description??'')
 const [assigneeId,setAssigneeId]=useState(task?.assigneeId??''),[dueDate,setDueDate]=useState(task?.dueDate??'')
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const archive=action==='archive'
 useEffect(()=>{dialog.current.showModal()},[])
 async function submit(event){
  event.preventDefault();if(lock.current)return
  if(!navigator.onLine){setError('Bạn đang mất kết nối. Kết nối mạng lại rồi thử tiếp.');return}
  lock.current=true;setBusy(true);setError('')
  try{
   if(archive)await repository.archive(group.id,task.id,task.version)
   else if(task)await repository.update(group.id,task.id,{title,description,assigneeId,dueDate},task.version)
   else await repository.create(group.id,{title,description,assigneeId,dueDate})
   onSaved(archive?'Đã lưu trữ công việc.':task?'Đã cập nhật công việc.':'Đã tạo và giao công việc.')
  }catch(error){setError(taskErrorMessage(error))}finally{lock.current=false;setBusy(false)}
 }
 return <dialog ref={dialog} className="group-dialog task-dialog" aria-labelledby="task-dialog-title" onCancel={event=>{event.preventDefault();if(!busy)onClose()}}>
  <div className="group-dialog-head"><h2 id="task-dialog-title">{archive?'Lưu trữ công việc?':task?'Chỉnh sửa công việc':'Tạo công việc'}</h2><button type="button" className="icon-action" aria-label="Đóng form công việc" disabled={busy} onClick={onClose}><X size={20}/></button></div>
  <form onSubmit={submit}><fieldset className="group-dialog-fields" disabled={busy}>
  {archive?<p className="archive-description">Công việc <strong>{task.title}</strong> sẽ được ẩn khỏi danh sách đang hoạt động. Dữ liệu và lịch sử vẫn được giữ lại.</p>:<>
   <label className="group-field" htmlFor="task-title">Tiêu đề công việc<input id="task-title" value={title} onChange={event=>setTitle(event.target.value)} required maxLength={120} autoFocus placeholder="Ví dụ: Thiết kế trang đăng nhập"/></label>
   <label className="group-field" htmlFor="task-description">Mô tả<span className="optional-label">Không bắt buộc</span><textarea id="task-description" value={description} onChange={event=>setDescription(event.target.value)} maxLength={2000} rows={4} placeholder="Nội dung cần làm và kết quả mong muốn…"/><span className="group-counter">{description.length}/2000 ký tự</span></label>
   <div className="task-form-row"><label className="group-field" htmlFor="task-assignee">Người phụ trách<select id="task-assignee" value={assigneeId} onChange={event=>setAssigneeId(event.target.value)} required><option value="">Chọn một thành viên</option>{members.map(member=><option key={member.uid} value={member.uid}>{member.displayName}</option>)}</select></label>
   <label className="group-field" htmlFor="task-deadline">Hạn chót<input id="task-deadline" type="date" value={dueDate} onChange={event=>setDueDate(event.target.value)} min="0001-01-01" max="9999-12-31" required/></label></div>
   <p className="task-form-hint">Công việc mới bắt đầu ở trạng thái Chưa làm. Người phụ trách phải thuộc nhóm {group.name}.</p>
  </>}
  {error&&<p className="form-notice error" role="alert">{error}</p>}
  <div className="group-dialog-actions"><button type="button" className="group-secondary" onClick={onClose}>Hủy</button><button type="submit" className={archive?'group-danger':'group-primary'}>{busy?'Đang lưu…':archive?'Xác nhận lưu trữ':task?'Lưu thay đổi':'Tạo và giao việc'}</button></div>
  </fieldset></form>
 </dialog>
}
