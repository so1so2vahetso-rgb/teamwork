export const statusLabels={todo:'Chưa làm',doing:'Đang làm',done:'Hoàn thành'}
export function vietnamDate(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part=>[part.type,part.value]))
 return `${parts.year}-${parts.month}-${parts.day}`
}
export function isOverdue(task,now=new Date()){return task.status!=='done'&&!task.archived&&task.dueDate<vietnamDate(now)}
const fold=value=>value.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
export function filterTasks(tasks,{search='',assignee='',status='',onlyOverdue=false}={},now=new Date()){
 return tasks.filter(task=>(!search||fold(task.title).includes(fold(search.trim())))&&(!assignee||task.assigneeId===assignee)&&(!status||task.status===status)&&(!onlyOverdue||isOverdue(task,now)))
}
export function summarizeTasks(tasks){
 const total=tasks.length,todo=tasks.filter(x=>x.status==='todo').length,doing=tasks.filter(x=>x.status==='doing').length,done=tasks.filter(x=>x.status==='done').length
 return{total,todo,doing,done,percent:total?Math.round(done/total*100):0}
}
