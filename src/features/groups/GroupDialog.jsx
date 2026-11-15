import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { groupErrorMessage } from './groupErrors.js'

export default function GroupDialog({ action, group, repository, onClose, onSaved }) {
  const dialog = useRef(null)
  const lock = useRef(false)
  const [name, setName] = useState(group?.name ?? '')
  const [description, setDescription] = useState(group?.description ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const archive = action === 'archive'
  const title = archive ? 'Lưu trữ nhóm?' : action === 'edit' ? 'Chỉnh sửa nhóm' : 'Tạo nhóm mới'
  useEffect(() => { dialog.current.showModal() }, [])

  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    if (!navigator.onLine) { setError('Bạn đang mất kết nối. Kết nối mạng lại rồi thử tiếp.'); return }
    lock.current = true; setBusy(true); setError('')
    try {
      if (archive) await repository.archive(group.id, group.version)
      else if (group) await repository.update(group.id, { name, description }, group.version)
      else await repository.create({ name, description })
      onSaved(archive ? 'Đã lưu trữ nhóm.' : group ? 'Đã cập nhật nhóm.' : 'Đã tạo nhóm mới.')
    } catch (error) { setError(groupErrorMessage(error)) }
    finally { lock.current = false; setBusy(false) }
  }

  return <dialog ref={dialog} className="group-dialog" aria-labelledby="group-dialog-title" onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <div className="group-dialog-head"><h2 id="group-dialog-title">{title}</h2><button type="button" className="icon-action" aria-label="Đóng cửa sổ" disabled={busy} onClick={onClose}><X size={20} /></button></div>
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="group-dialog-fields">
        {archive ? <p className="archive-description">Nhóm <strong>{group.name}</strong> sẽ được ẩn khỏi danh sách đang hoạt động. Dữ liệu và lịch sử của nhóm vẫn được giữ lại.</p> : <>
          <label className="group-field" htmlFor="group-name">Tên nhóm <input id="group-name" name="name" value={name} onChange={e => setName(e.target.value)} required maxLength={80} placeholder="Ví dụ: Nhóm đồ án hệ phân tán" autoFocus /></label>
          <label className="group-field" htmlFor="group-description">Mô tả <span className="optional-label">Không bắt buộc</span><textarea id="group-description" name="description" value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={4} placeholder="Mục tiêu hoặc nội dung làm việc của nhóm…" /><span className="group-counter">{description.length}/500 ký tự</span></label>
        </>}
        {error && <p className="form-notice error" role="alert">{error}</p>}
        <div className="group-dialog-actions"><button type="button" className="group-secondary" onClick={onClose}>Hủy</button><button type="submit" className={archive ? 'group-danger' : 'group-primary'}>{busy ? 'Đang lưu…' : archive ? 'Xác nhận lưu trữ' : group ? 'Lưu thay đổi' : 'Tạo nhóm'}</button></div>
      </fieldset>
    </form>
  </dialog>
}
