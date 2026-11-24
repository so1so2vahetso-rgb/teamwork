import {isOverdue, vietnamDate} from '../tasks/taskViewModel.js'

export function getReportWeek(now, offset = 0) {
  const monday = new Date(`${vietnamDate(now)}T00:00:00Z`)
  const daysSinceMonday = (monday.getUTCDay() + 6) % 7
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday + offset * 7)
  const nextMonday = new Date(monday)
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7)

  return {
    start: new Date(`${monday.toISOString().slice(0, 10)}T00:00:00+07:00`),
    end: new Date(`${nextMonday.toISOString().slice(0, 10)}T00:00:00+07:00`),
  }
}

export function summarizeProgress(events, tasks, week, now) {
  const finishedByTask = new Map()
  for (const event of events) {
    if (event.entityType !== 'task' || event.action !== 'status_changed' || event.toStatus !== 'done' || event.fromStatus === 'done') continue
    if (!(event.completedAt >= week.start && event.completedAt < week.end)) continue

    const key = `${event.groupId}/${event.entityId}`
    const existing = finishedByTask.get(key)
    if (!existing || event.completedAt > existing.completedAt ||
        (event.completedAt.getTime() === existing.completedAt.getTime() && event.version > existing.version)) {
      finishedByTask.set(key, event)
    }
  }

  return {
    finished: [...finishedByTask.values()].sort((a, b) => b.completedAt - a.completedAt),
    overdue: tasks.filter(task => isOverdue(task, now)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  }
}
