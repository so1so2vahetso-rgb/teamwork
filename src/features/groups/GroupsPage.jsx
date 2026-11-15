import { useEffect, useState } from 'react'
import { Archive, ArrowLeft, ArrowRight, FolderKanban, Layers, LogOut, Pencil, Plus, ShieldCheck, UsersRound, WifiOff,LayoutDashboard,ListChecks,History } from 'lucide-react'
import { configuredAdminUid, getFirebaseClients } from '../../lib/firebase.js'
import { resolveAccountRole, createSessionService } from '../auth/sessionService.js'
import { createGroupRepository } from './groupRepository.js'
import GroupDialog from './GroupDialog.jsx'
import MembersDialog from './MembersDialog.jsx'
import {createMemberRepository} from './memberRepository.js'
import TasksPage from '../tasks/TasksPage.jsx'
import TaskOverview from '../tasks/TaskOverview.jsx'
import ActivityPage from '../activity/ActivityPage.jsx'
import { groupErrorMessage } from './groupErrors.js'
import './groups.css'

const formatDate = timestamp => timestamp?.toDate ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(timestamp.toDate()) : 'Đang cập nhật'

export default function GroupsPage({ user, onBack }) {
  const [groups, setGroups] = useState([])
  const [repository, setRepository] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [role,setRole]=useState(null)
  const [selectedGroup,setSelectedGroup]=useState(null)
  const [taskGroupId,setTaskGroupId]=useState(null)
  const [page,setPage]=useState('overview')

  useEffect(() => {
    document.title = 'Quản lý nhóm · TeamWork'
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update); window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])

  useEffect(() => {
    let active = true, unsubscribe
    setLoading(true); setError(''); setConfirmed(false); setGroups([])
    async function load() {
      try {
        const clients = await getFirebaseClients()
        const role = await resolveAccountRole({ ...clients, user, adminUid: configuredAdminUid })
        if (!active) return
        setRole(role)
        if(role!=='admin'){
          unsubscribe=createMemberRepository(clients).watchMyGroups(user.uid,groups=>{if(active){setGroups(groups);setLoading(false);setConfirmed(false)}},error=>{if(active){setGroups([]);setSelectedGroup(null);setLoading(false);setError(groupErrorMessage(error))}})
          return
        }
        const repo = createGroupRepository(clients)
        setRepository(repo)
        unsubscribe = repo.watch(({ groups, serverConfirmed }) => {
          if (!active) return
          setGroups(groups); setConfirmed(serverConfirmed); setLoading(false)
        }, error => { if (active) { setError(groupErrorMessage(error)); setGroups([]); setConfirmed(false); setLoading(false); setDialog(null) } })
      } catch (error) { if (active) { setError(groupErrorMessage(error)); setLoading(false) } }
    }
    load()
    return () => { active = false; unsubscribe?.() }
  }, [user.uid, refresh])
  useEffect(()=>{if(selectedGroup&&!groups.some(group=>group.id===selectedGroup.id))setSelectedGroup(null)},[groups,selectedGroup])
  useEffect(()=>{if(taskGroupId&&!groups.some(group=>group.id===taskGroupId))setTaskGroupId(null)},[groups,taskGroupId])

  async function logout() {
    setLeaving(true)
    try { await createSessionService(await getFirebaseClients()).logout() }
    catch (error) { setError(groupErrorMessage(error)) }
    finally { setLeaving(false) }
  }
  const isAdmin=role==='admin'
  const canWrite = isAdmin && !!repository && confirmed && online && !error
  function open(action, group = null) { setNotice(''); setDialog({ action, group }) }
  const taskGroup=groups.find(group=>group.id===taskGroupId)
  function navigate(next){setTaskGroupId(null);setPage(next);setNotice('')}

  return <div className="workspace-layout">
    <aside className="workspace-sidebar"><div className="workspace-caption">KHÔNG GIAN LÀM VIỆC</div><nav aria-label="Điều hướng nhóm"><button className={!taskGroupId&&page==="overview"?"workspace-nav-current":""} type="button" onClick={()=>navigate("overview")}><LayoutDashboard size={18}/>Tổng quan</button><button className={!taskGroupId&&page==="mine"?"workspace-nav-current":""} type="button" onClick={()=>navigate("mine")}><ListChecks size={18}/>Công việc của tôi</button><button className={taskGroupId||page==="groups"?"workspace-nav-current":""} type="button" onClick={()=>navigate("groups")}><FolderKanban size={18}/>Nhóm làm việc</button>{isAdmin&&<button className={page==="history"?"workspace-nav-current":""} type="button" onClick={()=>navigate("history")}><History size={18}/>Lịch sử hoạt động</button>}<button type="button" onClick={onBack}><ArrowLeft size={18} />Tài khoản của tôi</button></nav><div className="workspace-account"><span className="workspace-role"><ShieldCheck size={15} />{isAdmin?'Admin':'Thành viên'}</span><span className="workspace-email">{user.email}</span><button type="button" onClick={logout} disabled={leaving}><LogOut size={17} />{leaving ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></div></aside>
    <main className="groups-main">{taskGroup?<TasksPage key={taskGroup.id} group={taskGroup} user={user} isAdmin={isAdmin} onBack={()=>navigate('groups')} onMembers={()=>setSelectedGroup(taskGroup)}/>:page==='history'&&isAdmin?<ActivityPage user={user}/>:page==='overview'||page==='mine'?<TaskOverview key={page} groups={groups} user={user} isAdmin={isAdmin} mine={page==='mine'} onOpenGroup={id=>setTaskGroupId(id)}/>:<><div className="groups-breadcrumb">Không gian quản lý <ArrowRight size={13} /> Nhóm làm việc</div>
      <header className="groups-heading"><div><span className="groups-eyebrow">CÙNG NHAU LÀM VIỆC TỐT HƠN</span><h1>{isAdmin?'Nhóm làm việc':'Nhóm của tôi'}<span>.</span></h1><p>{isAdmin?'Tạo không gian chung cho mỗi mục tiêu của bạn.':'Các nhóm bạn được admin thêm vào.'}</p></div>{isAdmin&&<button className="group-primary" type="button" disabled={!canWrite} onClick={() => open('create')}><Plus size={18} />Tạo nhóm mới</button>}</header>
      {error && <div className="group-error" role="alert"><span>{error}</span><button type="button" className="group-secondary" onClick={() => setRefresh(value => value + 1)}>Tải lại</button></div>}
      {notice && <p className="group-success" role="status">{notice}</p>}
      {!online ? <p className="group-connection" role="status"><WifiOff size={17} />Mất kết nối. Các thao tác lưu tạm thời bị khóa.</p> : isAdmin&&!confirmed && !loading && !error ? <p className="group-connection" role="status">Đang xác nhận dữ liệu với máy chủ…</p> : null}
      <div className="groups-list-heading"><h2>Nhóm đang hoạt động <span>{loading || error ? '—' : groups.length}</span></h2><span>{isAdmin?'Chỉ admin được quản lý nhóm':'Chỉ hiển thị nhóm bạn tham gia'}</span></div>
      {loading ? <p className="groups-loading" role="status">Đang tải danh sách nhóm…</p> : !error && groups.length === 0 ? <section className="groups-empty"><span className="empty-group-icon"><UsersRound size={32} strokeWidth={1.5} /></span><h2>{isAdmin?'Một nhóm mới, một khởi đầu mới':'Bạn chưa tham gia nhóm nào'}</h2><p>{isAdmin?'Tạo nhóm đầu tiên để bắt đầu sắp xếp công việc.':'Admin sẽ thêm bạn vào nhóm. Danh sách sẽ tự cập nhật tại đây.'}</p>{isAdmin&&<button className="group-primary" type="button" disabled={!canWrite} onClick={() => open('create')}><Plus size={18} />Tạo nhóm đầu tiên</button>}</section> : <div className="groups-grid">{groups.map(group => <article className="group-card" key={group.id}>
        <div className="group-card-top"><span className="group-card-icon"><Layers size={24} strokeWidth={1.6} /></span><span className="group-active"><span />Đang hoạt động</span></div><h3>{group.name}</h3><p className="group-description">{group.description || 'Chưa có mô tả cho nhóm này.'}</p><div className="group-card-meta">Tạo ngày {formatDate(group.createdAt)}</div><button className="group-primary group-members-button" type="button" disabled={!online} onClick={()=>setTaskGroupId(group.id)} aria-label={`Công việc ${group.name}`}>Công việc</button><button className="group-secondary group-members-button" type="button" disabled={!online} onClick={()=>setSelectedGroup(group)} aria-label={`Thành viên ${group.name}`}><UsersRound size={16}/>Thành viên</button>{isAdmin&&<div className="group-card-actions"><button type="button" className="group-secondary" disabled={!canWrite} onClick={() => open('edit', group)} aria-label={`Chỉnh sửa ${group.name}`}><Pencil size={15} />Chỉnh sửa</button><button type="button" className="group-archive" disabled={!canWrite} onClick={() => open('archive', group)} aria-label={`Lưu trữ ${group.name}`}><Archive size={15} />Lưu trữ</button></div>}
      </article>)}</div>}
    </> }</main>
    {dialog && repository && <GroupDialog key={`${dialog.action}-${dialog.group?.id ?? 'new'}`} {...dialog} repository={repository} onClose={() => setDialog(null)} onSaved={message => { setDialog(null); setNotice(message) }} />}
    {selectedGroup&&<MembersDialog key={selectedGroup.id} group={selectedGroup} isAdmin={isAdmin} onClose={()=>setSelectedGroup(null)} onAccessLost={()=>{setSelectedGroup(null);setNotice('Quyền truy cập nhóm đã thay đổi.')}}/>}
  </div>
}


