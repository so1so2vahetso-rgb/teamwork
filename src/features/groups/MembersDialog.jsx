import {useEffect,useRef,useState} from 'react'
import {Search,UserPlus,UsersRound,X} from 'lucide-react'
import {getFirebaseClients} from '../../lib/firebase.js'
import {createMemberRepository} from './memberRepository.js'
import {groupErrorMessage} from './groupErrors.js'

export default function MembersDialog({group,isAdmin,onClose,onAccessLost}){
  const dialog=useRef(null),lock=useRef(false)
  const [repo,setRepo]=useState(null),[members,setMembers]=useState([]),[loading,setLoading]=useState(true)
  const [confirmed,setConfirmed]=useState(false),[email,setEmail]=useState(''),[results,setResults]=useState(null)
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[removing,setRemoving]=useState(null)
  useEffect(()=>{dialog.current.showModal()},[])
  useEffect(()=>{
    let active=true,stop
    getFirebaseClients().then(clients=>{
      if(!active)return
      const repository=createMemberRepository(clients);setRepo(repository)
      stop=repository.watchMembers(group.id,({members,serverConfirmed})=>{if(active){setMembers(members);setConfirmed(serverConfirmed);setLoading(false)}},error=>{
        if(!active)return
        setMembers([]);setConfirmed(false);setLoading(false)
        if(!isAdmin&&error.code==='permission-denied')onAccessLost()
        else setError(groupErrorMessage(error))
      })
    }).catch(error=>{if(active){setError(groupErrorMessage(error));setLoading(false)}})
    return()=>{active=false;stop?.()}
  },[group.id,isAdmin])
  async function perform(action){
    if(lock.current||!repo)return
    if(!navigator.onLine){setError('Bạn đang mất kết nối. Kiểm tra mạng rồi thử lại.');return}
    lock.current=true;setBusy(true);setError('');setNotice('')
    try{await action()}catch(error){setError(groupErrorMessage(error))}finally{lock.current=false;setBusy(false)}
  }
  function search(event){event.preventDefault();perform(async()=>{setResults(null);setResults(await repo.findByEmail(email))})}
  function add(uid){perform(async()=>{await repo.add(group.id,uid);setNotice('Đã thêm thành viên vào nhóm.');setResults(null);setEmail('')})}
  function remove(){perform(async()=>{await repo.remove(group.id,removing.uid,removing.version);setNotice('Đã xóa thành viên khỏi nhóm.');setRemoving(null)})}
  return <dialog ref={dialog} className="group-dialog members-dialog" aria-labelledby="members-title" onCancel={event=>{event.preventDefault();if(!busy)onClose()}}>
    <div className="group-dialog-head"><div><h2 id="members-title">Thành viên nhóm</h2><p className="members-group-name">{group.name}</p></div><button type="button" className="icon-action" aria-label="Đóng danh sách thành viên" disabled={busy} onClick={onClose}><X size={20}/></button></div>
    {isAdmin&&<form className="members-search" onSubmit={search}><label className="group-field" htmlFor="member-email">Thêm người đã đăng ký<input id="member-email" type="email" value={email} onChange={e=>{setEmail(e.target.value);setResults(null)}} placeholder="Nhập chính xác email tài khoản" required disabled={busy}/></label><button className="group-primary" type="submit" disabled={busy||!repo}><Search size={16}/>{busy?'Đang xử lý…':'Tìm tài khoản'}</button></form>}
    {results&&<div className="member-search-results">{results.length===0?<p>Chưa tìm thấy hồ sơ có email này. Người đó cần đăng ký và hoàn tất hồ sơ trước.</p>:results.map(account=><div className="member-row" key={account.uid}><div><strong>{account.displayName}</strong><span>{account.email}</span></div><button className="group-primary" type="button" disabled={busy||!confirmed||members.some(member=>member.uid===account.uid)} onClick={()=>add(account.uid)}><UserPlus size={15}/>{members.some(member=>member.uid===account.uid)?'Đã tham gia':'Thêm vào nhóm'}</button></div>)}</div>}
    {error&&<p className="form-notice error" role="alert">{error}</p>}{notice&&<p className="group-success" role="status">{notice}</p>}
    <div className="members-list-title"><UsersRound size={17}/><h3>Thành viên hiện tại</h3><span>{members.length}</span></div>
    {loading?<p role="status" className="members-empty">Đang tải thành viên…</p>:members.length===0?<p className="members-empty">Chưa có thành viên trong nhóm.</p>:members.map(member=><div className="member-row" key={member.uid}><span className="member-avatar" aria-hidden="true">{member.displayName.slice(0,1).toUpperCase()}</span><div className="member-name"><strong>{member.displayName}</strong><span>{member.openTaskCount} việc chưa hoàn thành</span></div>{isAdmin&&<button type="button" className="group-archive" disabled={busy||!confirmed} onClick={()=>setRemoving(member)} aria-label={`Xóa ${member.displayName} khỏi nhóm`}>Xóa khỏi nhóm</button>}</div>)}
    {removing&&<div className="member-remove-confirm" role="group" aria-label="Xác nhận xóa thành viên"><p>Xóa <strong>{removing.displayName}</strong> khỏi nhóm này? Tài khoản và các nhóm khác của người đó vẫn được giữ.</p><div className="group-dialog-actions"><button type="button" className="group-secondary" disabled={busy} onClick={()=>setRemoving(null)}>Hủy</button><button type="button" className="group-danger" disabled={busy} onClick={remove}>Xác nhận xóa</button></div></div>}
  </dialog>
}

