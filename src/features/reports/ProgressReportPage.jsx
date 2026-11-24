import {useEffect, useRef, useState} from 'react'
import {ArrowLeft, Printer, RefreshCw} from 'lucide-react'
import {getFirebaseClients} from '../../lib/firebase.js'
import {groupErrorMessage} from '../groups/groupErrors.js'
import {vietnamDate} from '../tasks/taskViewModel.js'
import {getReportWeek} from './progressReportModel.js'
import {loadProgressReport} from './progressReportRepository.js'
import './progressReport.css'

const formatDay = day => day.split('-').reverse().join('/')
const weekLabel = week => `${formatDay(vietnamDate(week.start))} – ${formatDay(vietnamDate(new Date(week.end.getTime() - 1)))}`

function ReportRows({rows, groupNames, finished = false}) {
  if (!rows.length) {
    return <p className="progress-report-muted">{finished ? 'Không có việc hoàn thành trong kỳ này.' : 'Không có việc quá hạn.'}</p>
  }

  return <ul className="progress-report-rows">
    {rows.map(row => {
      const date = finished ? vietnamDate(row.completedAt) : row.dueDate
      return <li key={`${row.groupId}/${finished ? row.entityId : row.id}`}>
        <div><strong>{finished ? row.name : row.title}</strong><small>{groupNames.get(row.groupId)}</small></div>
        <span>{row.assigneeName}</span>
        <time dateTime={date}>{finished ? 'Xong' : 'Hạn'} {formatDay(date)}</time>
      </li>
    })}
  </ul>
}

export default function ProgressReportPage({groups, ready, online, groupsError, onReloadGroups}) {
  const [selectedGroup, setSelectedGroup] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [result, setResult] = useState(null)
  const [preview, setPreview] = useState(false)
  const openPreview = useRef(null)
  const closePreview = useRef(null)
  const groupNames = new Map(groups.map(group => [group.id, group.name]))
  const groupId = groupNames.has(selectedGroup) ? selectedGroup : ''
  const scopeKey = JSON.stringify(groupId ? [groupId] : [...groupNames.keys()].sort())
  const requestKey = JSON.stringify([scopeKey, weekOffset, refresh])
  const canLoad = ready && online && !groupsError
  const current = canLoad && result?.key === requestKey ? result : null
  const report = current?.report
  const showPreview = preview && !!report

  useEffect(() => { document.title = 'Báo cáo tiến độ · TeamWork' }, [])

  useEffect(() => {
    if (!canLoad) {
      setResult(null)
      setPreview(false)
      return
    }
    let active = true
    const now = new Date()
    const week = getReportWeek(now, weekOffset)

    getFirebaseClients()
      .then(({db}) => loadProgressReport(db, {groupIds: JSON.parse(scopeKey), week, now}))
      .then(report => {
        if (active) setResult({key: requestKey, report, week, now})
      })
      .catch(error => {
        if (active) setResult({key: requestKey, error: error.code === 'permission-denied'
          ? 'Tài khoản này không có quyền xem báo cáo.'
          : error.code === 'unavailable' || error.code === 'resource-exhausted'
            ? groupErrorMessage(error)
            : 'Chưa tải được báo cáo. Vui lòng thử lại.'})
      })
    return () => { active = false }
  }, [canLoad, requestKey, scopeKey, weekOffset])

  useEffect(() => {
    if (showPreview) closePreview.current?.focus()
  }, [showPreview])

  const error = online && (groupsError || current?.error)
  const loading = online && !error && !report
  const now = current?.now ?? new Date()
  return <section className={`progress-report${showPreview ? ' progress-report-preview' : ''}`}>
    <header className="groups-heading progress-report-controls" hidden={showPreview}>
      <div><h1>Báo cáo tiến độ<span>.</span></h1><p>Theo dõi việc hoàn thành trong tuần và việc đang quá hạn.</p></div>
      <div className="progress-report-actions">
        <button className="group-secondary" type="button" disabled={loading || !online} onClick={() => {
          if (groupsError) onReloadGroups()
          setRefresh(value => value + 1)
        }}><RefreshCw size={16} aria-hidden="true"/>Làm mới</button>
        <button className="group-primary" type="button" ref={openPreview} disabled={!report} onClick={() => setPreview(true)}>
          <Printer size={16} aria-hidden="true"/>Xem bản in
        </button>
      </div>
    </header>
    <div className="progress-report-filters progress-report-controls" hidden={showPreview}>
      <label>Nhóm<select value={groupId} onChange={event => setSelectedGroup(event.target.value)}>
        <option value="">Tất cả nhóm đang hoạt động</option>
        {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
      </select></label>
      <label>Kỳ báo cáo<select value={weekOffset} onChange={event => setWeekOffset(Number(event.target.value))}>
        <option value={0}>Tuần này</option>
        <option value={-1}>Tuần trước</option>
      </select></label>
    </div>
    {!online && <p className="group-connection" role="status">Cần kết nối mạng để tải báo cáo mới nhất.</p>}
    {error && <p className="group-error" role="alert">{error}</p>}
    {loading && <p className="groups-loading" role="status">Đang tải báo cáo…</p>}
    {report && <>
      {showPreview && <div className="progress-report-preview-bar">
        <button className="group-secondary" type="button" ref={closePreview} onClick={() => {
          setPreview(false)
          requestAnimationFrame(() => openPreview.current?.focus())
        }}><ArrowLeft size={16} aria-hidden="true"/>Quay lại báo cáo</button>
        <button className="group-primary" type="button" onClick={() => window.print()}><Printer size={16} aria-hidden="true"/>In / Lưu PDF</button>
      </div>}
      <article className="progress-report-sheet" aria-label="Nội dung báo cáo">
        <header className="progress-report-sheet-heading">
          <div><h2>Báo cáo công việc</h2><p>{groupId ? groupNames.get(groupId) : 'Tất cả nhóm đang hoạt động'} · {weekLabel(current.week)}</p></div>
          <p>Ngày lập: {formatDay(vietnamDate(now))}</p>
        </header>
        <dl className="progress-report-totals">
          <div><dt>Hoàn thành trong kỳ</dt><dd>{report.finished.length}</dd></div>
          <div><dt>Đang quá hạn</dt><dd>{report.overdue.length}</dd></div>
        </dl>
        <section className="progress-report-block">
          <h3>Được đánh dấu hoàn thành trong kỳ</h3>
          <ReportRows rows={report.finished} groupNames={groupNames} finished/>
        </section>
        <section className="progress-report-block">
          <h3>Đang quá hạn <small>Tính đến {formatDay(vietnamDate(now))}</small></h3>
          <ReportRows rows={report.overdue} groupNames={groupNames}/>
        </section>
      </article>
    </>}
  </section>
}
