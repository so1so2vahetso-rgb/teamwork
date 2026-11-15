import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Eye, EyeOff, Info, Layers, LockKeyhole, Mail, UserRound } from 'lucide-react'
import TeamIntro from './TeamIntro.jsx'
import { firebaseSetup, getFirebaseClients } from '../../lib/firebase.js'
import { authErrorMessage } from './authErrors.js'
import RegistrationResult from './RegistrationResult.jsx'
const GroupsPage = lazy(() => import('../groups/GroupsPage.jsx'))

function PasswordField({ id, label, autoComplete, hint }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <LockKeyhole size={18} aria-hidden="true" />
        <input id={id} name={id} type={visible ? 'text' : 'password'} placeholder="Nhập mật khẩu của bạn" autoComplete={autoComplete} required minLength={6} aria-describedby={hint ? `${id}-hint` : undefined} />
        <button className="password-toggle" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`} aria-pressed={visible}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <span className="field-hint" id={`${id}-hint`}>{hint}</span>}
    </div>
  )
}

function AuthForm({ mode, busy, onBusyChange }) {
  const isRegister = mode === 'register'
  const [notice, setNotice] = useState(null)
  const submitting = useRef(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting.current) return
    const data = new FormData(event.currentTarget)
    if (isRegister && !String(data.get('name')).trim()) {
      setNotice({ error: true, text: 'Vui lòng nhập họ và tên của bạn.' })
      event.currentTarget.elements.name.focus()
      return
    }
    if (isRegister && data.get('password') !== data.get('confirm-password')) {
      setNotice({ error: true, text: 'Mật khẩu xác nhận chưa khớp. Bạn kiểm tra lại nhé.' })
      event.currentTarget.elements['confirm-password'].focus()
      return
    }
    submitting.current = true
    onBusyChange(true)
    setNotice(null)
    try {
      const clients = await getFirebaseClients()
      if (isRegister) {
        const { createRegistrationService } = await import('./registrationService.js')
        await createRegistrationService(clients).register({ name: String(data.get('name')), email: String(data.get('email')), password: String(data.get('password')) })
      } else {
        const { createSessionService } = await import('./sessionService.js')
        await createSessionService(clients).login({ email: String(data.get('email')), password: String(data.get('password')) })
      }
    } catch (error) {
      setNotice({ error: true, text: authErrorMessage(error) })
    } finally {
      submitting.current = false
      onBusyChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} onChange={() => notice && setNotice(null)} className="auth-form" aria-busy={busy}>
      <fieldset className="auth-fields" disabled={busy}>
      {isRegister && <div className="field"><label htmlFor="name">Họ và tên</label><div className="input-wrap"><UserRound size={18} aria-hidden="true" /><input id="name" name="name" placeholder="Ví dụ: Nguyễn Văn An" autoComplete="name" required maxLength={80} /></div></div>}
      <div className="field"><label htmlFor="email">Email</label><div className="input-wrap"><Mail size={18} aria-hidden="true" /><input id="email" name="email" type="email" placeholder="ban@example.com" autoComplete="email" required /></div></div>
      <PasswordField id="password" label="Mật khẩu" autoComplete={isRegister ? 'new-password' : 'current-password'} hint={isRegister ? 'Sử dụng ít nhất 6 ký tự.' : undefined} />
      {isRegister && <PasswordField id="confirm-password" label="Xác nhận mật khẩu" autoComplete="new-password" />}
      {notice && <div className={`form-notice ${notice.error ? 'error' : ''}`} role={notice.error ? 'alert' : 'status'}><Info size={18} aria-hidden="true" /><span>{notice.text}</span></div>}
      <button className="submit-button" type="submit" disabled={busy}>{busy ? isRegister ? 'Đang tạo tài khoản…' : 'Đang đăng nhập…' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}<ArrowRight size={18} aria-hidden="true" /></button>
      <p className="form-footnote">{isRegister ? 'Tài khoản mới sẽ là thành viên. Admin sẽ thêm bạn vào nhóm.' : 'Đăng nhập bằng tài khoản thành viên hoặc admin của bạn.'}</p>
      </fieldset>
    </form>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [user, setUser] = useState(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(firebaseSetup.status === 'ready')
  const [sessionError, setSessionError] = useState('')
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [autoEnter,setAutoEnter]=useState(true)
  const isRegister = mode === 'register'
  useEffect(() => { document.title = `${isRegister ? 'Đăng ký' : 'Đăng nhập'} · TeamWork` }, [isRegister])
  useEffect(() => {
    const onSyncError = () => setSessionError('Chưa đồng bộ được đăng xuất từ tab khác. Vui lòng bấm Đăng xuất tại tab này.')
    window.addEventListener('teamwork-session-sync-error', onSyncError)
    return () => window.removeEventListener('teamwork-session-sync-error', onSyncError)
  }, [])
  useEffect(() => {
    if (firebaseSetup.status !== 'ready') return
    let active = true
    let unsubscribe
    async function restore() {
      try {
        const { auth } = await getFirebaseClients()
        const { onAuthStateChanged } = await import('firebase/auth')
        if (!active) return
        unsubscribe = onAuthStateChanged(auth, user => { if (active) { setUser(user);setAutoEnter(true); if (!user) setWorkspaceOpen(false); setSessionError(''); setChecking(false) } }, error => { if (active) { setSessionError(authErrorMessage(error)); setChecking(false) } })
      } catch (error) { if (active) { setSessionError(authErrorMessage(error)); setChecking(false) } }
    }
    restore()
    return () => { active = false; unsubscribe?.() }
  }, [])

  return (
    <div className="app-shell">
      <header className="site-header"><a className="brand" href="./" aria-label="TeamWork — Trang đầu"><span className="brand-mark"><Layers size={22} strokeWidth={2.2} /></span>TeamWork<span className="brand-dot">.</span></a><div className="header-note"><span className="status-dot" />Không gian làm việc nhóm</div></header>
      {user && workspaceOpen ? <Suspense fallback={<p role="status">Đang mở không gian quản lý…</p>}><GroupsPage key={user.uid} user={user} onBack={() => setWorkspaceOpen(false)} /></Suspense> : <main className="auth-layout">
        <TeamIntro />
        <section className="auth-side" aria-label={isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập tài khoản'}>
          <div className="auth-card">
            <div className="welcome-mark" aria-hidden="true"><UserRound size={23} /></div>
            {checking ? <p role="status">Đang kiểm tra phiên tài khoản…</p> : user && !busy ? <RegistrationResult key={user.uid} user={user} onReady={()=>{if(autoEnter){setAutoEnter(false);setWorkspaceOpen(true)}}} onOpenGroups={() => setWorkspaceOpen(true)} onClose={() => { setUser(null); setMode('login') }} /> : <>
            <h2>{isRegister ? 'Bắt đầu cùng nhóm bạn' : 'Chào mừng bạn trở lại!'}</h2>
            <p className="auth-description">{isRegister ? 'Tạo tài khoản để sẵn sàng nhận công việc đầu tiên.' : 'Công việc đã sẵn sàng. Cùng bắt đầu thôi.'}</p>
            <div className="auth-tabs" role="group" aria-label="Chọn đăng nhập hoặc đăng ký"><button type="button" disabled={busy} className={!isRegister ? 'active' : ''} aria-pressed={!isRegister} onClick={() => setMode('login')}>Đăng nhập</button><button type="button" disabled={busy} className={isRegister ? 'active' : ''} aria-pressed={isRegister} onClick={() => setMode('register')}>Đăng ký</button></div>
            <AuthForm key={mode} mode={mode} busy={busy} onBusyChange={setBusy} />
            <div className="switch-prompt">{isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <button type="button" disabled={busy} onClick={() => setMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Đăng nhập ngay' : 'Đăng ký ngay'}<ArrowRight size={14} aria-hidden="true" /></button></div>
            </>}
            {sessionError && <p className="form-notice error" role="alert">{sessionError}</p>}
          </div>
          <div className="auth-footer"><span><Check size={14} /> Một nơi cho mọi công việc</span><span>TeamWork © {new Date().getFullYear()}</span></div>
        </section>
      </main>}
    </div>
  )
}


