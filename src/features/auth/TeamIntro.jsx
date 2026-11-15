import { ArrowUpRight, Check, CheckCheck, Circle, LayoutGrid, Users } from 'lucide-react'

const sampleTasks = [
  { title: 'Phác thảo giao diện', person: 'Chi', initials: 'C', state: 'Hoàn thành', icon: Check, className: 'done' },
  { title: 'Thiết kế trang đăng nhập', person: 'An', initials: 'A', state: 'Đang làm', icon: Circle, className: 'doing' },
  { title: 'Chuẩn bị nội dung báo cáo', person: 'Bình', initials: 'B', state: 'Chưa làm', icon: Circle, className: 'todo' },
]

export default function TeamIntro() {
  return (
    <section className="intro" aria-label="Giới thiệu TeamWork">
      <div className="intro-grid" aria-hidden="true" />
      <div className="intro-content">
        <div className="eyebrow"><span /> LÀM VIỆC CÙNG NHAU, TỐT HƠN MỖI NGÀY</div>
        <h1>Mỗi người một việc.<br />Cả nhóm một mục tiêu<span>.</span></h1>
        <p className="intro-description">Một nơi để phân công công việc, theo dõi tiến độ<br className="desktop-break" /> và cùng nhau hoàn thành những điều quan trọng.</p>

        <div className="project-preview" aria-label="Minh họa công việc nhóm với dữ liệu mẫu">
          <div className="preview-heading">
            <div className="project-icon"><LayoutGrid size={20} /></div>
            <div><strong>Đồ án của chúng mình</strong><span>Nhóm A · 3 thành viên</span></div>
            <ArrowUpRight size={20} className="preview-arrow" aria-hidden="true" />
          </div>
          <div className="progress-label"><span>Tiến độ nhóm</span><strong>1/3 hoàn thành</strong></div>
          <div className="progress-track"><span /></div>
          <div className="preview-tasks">
            {sampleTasks.map(({ title, person, initials, state, icon: Icon, className }) => (
              <div className={`preview-task ${className}`} key={title}>
                <span className="task-status-icon"><Icon size={14} /></span>
                <div className="task-copy"><strong>{title}</strong><span>{state}</span></div>
                <span className={`avatar avatar-${initials.toLowerCase()}`} aria-label={`Người phụ trách: ${person}`}>{initials}</span>
              </div>
            ))}
          </div>
          <div className="preview-bottom"><Users size={14} aria-hidden="true" /><span>Mỗi công việc, một người phụ trách</span><span className="sample-label">Minh họa</span></div>
        </div>

        <div className="intro-benefits"><span><CheckCheck size={17} /> Phân công rõ ràng</span><span><CheckCheck size={17} /> Tiến độ minh bạch</span></div>
      </div>
      <div className="intro-foot"><span>Không bỏ sót việc. Không lỡ nhịp nhóm.</span><span aria-hidden="true">✦</span></div>
    </section>
  )
}
