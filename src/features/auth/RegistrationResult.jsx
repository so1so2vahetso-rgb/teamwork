import { useEffect, useState } from 'react'
import { CheckCircle2, Info, ShieldCheck, UserRound } from 'lucide-react'
import { configuredAdminUid, getFirebaseClients } from '../../lib/firebase.js'
import { authErrorMessage } from './authErrors.js'
import { accountRole } from './accountRole.js'

export default function RegistrationResult({ user, onClose, onOpenGroups,onReady }) {
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState(user.displayName ?? '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [role, setRole] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const expectsAdmin = accountRole(user, configuredAdminUid) === 'admin'
  useEffect(()=>{if(profile)onReady?.()},[profile])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    async function load() {
      try {
        const { createRegistrationService } = await import('./registrationService.js')
        const { resolveAccountRole } = await import('./sessionService.js')
        const clients = await getFirebaseClients()
        const [found, role] = await Promise.all([
          createRegistrationService(clients).readProfile(),
          resolveAccountRole({ ...clients, user, adminUid: configuredAdminUid }),
        ])
        if (active) { setProfile(found); setRole(role) }
      } catch (error) { if (active) setError(authErrorMessage(error)) }
      finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [user.uid, refresh])

  async function retry(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true); setError('')
    try {
      const { createRegistrationService } = await import('./registrationService.js')
      await createRegistrationService(await getFirebaseClients()).completeProfile(name)
      const profile = await createRegistrationService(await getFirebaseClients()).readProfile()
      setProfile(profile)
    } catch (error) { setError(authErrorMessage(error)) }
    finally { setSaving(false) }
  }

  async function close() {
    setSaving(true); setError('')
    try {
      const { createSessionService } = await import('./sessionService.js')
      await createSessionService(await getFirebaseClients()).logout()
      onClose()
    } catch (error) { setError(authErrorMessage(error)) }
    finally { setSaving(false) }
  }

  if (loading) return <p className="registration-loading" role="status">Đang kiểm tra hồ sơ tài khoản…</p>
  return <div className="registration-result" aria-busy={saving}>
    {profile ? <><CheckCircle2 className="registration-success-icon" size={34} aria-hidden="true" /><h3>Xin chào, {profile.displayName}!</h3><span className={`account-role ${role === 'admin' ? 'account-role-admin' : ''}`}>{role === 'admin' ? <ShieldCheck size={16} aria-hidden="true" /> : <UserRound size={16} aria-hidden="true" />}{role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</span><p className="account-email">{user.email}</p><div className="waiting-note"><Info size={18} aria-hidden="true" /><span>{role === 'admin' ? 'Bạn là admin duy nhất của TeamWork. Mở Quản lý nhóm để tạo và sắp xếp các nhóm làm việc. Bạn có thể thêm hoặc xóa thành viên trong từng nhóm.' : 'Mở Nhóm của tôi để xem các nhóm bạn tham gia. Nếu danh sách trống, hãy chờ admin thêm bạn vào nhóm.'}</span></div>
    {expectsAdmin && role !== 'admin' && <div className="role-setup-note"><p>Chưa xác nhận được quyền admin trên máy chủ. Hãy Publish Rules mới rồi kiểm tra lại.</p><button type="button" className="session-close" onClick={() => setRefresh(value => value + 1)} disabled={saving}>Kiểm tra lại quyền</button></div>}
    <button type="button" className="submit-button" onClick={onOpenGroups} disabled={saving}>{role==='admin'?'Quản lý nhóm':'Nhóm của tôi'}</button>
    </>
      : <><h3>Hoàn tất hồ sơ của bạn</h3><p>Tài khoản <strong>{user.email}</strong> đã có phiên đăng nhập, nhưng chưa xác nhận được hồ sơ. Bạn chỉ cần lưu lại hồ sơ, không tạo tài khoản mới.</p><form onSubmit={retry} className="auth-form"><div className="field"><label htmlFor="recovery-name">Họ và tên</label><div className="input-wrap"><input id="recovery-name" name="name" value={name} onChange={e => setName(e.target.value)} required maxLength={80} autoComplete="name" disabled={saving} /></div></div><button type="submit" className="submit-button" disabled={saving}>{saving ? 'Đang lưu…' : 'Thử lưu hồ sơ'}</button></form></>}
    {error && <div className="form-notice error" role="alert">{error}</div>}
    <button className="session-close" type="button" onClick={close} disabled={saving}>{saving ? 'Đang xử lý…' : 'Đăng xuất'}</button>
    <p className="field-hint">Phiên đăng nhập được giữ khi tải lại trang. Đăng xuất khi dùng xong máy dùng chung.</p>
  </div>
}

