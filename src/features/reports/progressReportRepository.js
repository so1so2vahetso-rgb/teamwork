import {collection, getDocsFromServer, query, where} from 'firebase/firestore'
import {summarizeProgress} from './progressReportModel.js'

export async function loadProgressReport(db, {groupIds, week, now}) {
  if (groupIds.length === 0) return {finished: [], overdue: []}

  const activity = collection(db, 'activityLogs')
  const activityInPeriod = query(activity, where('createdAt', '>=', week.start), where('createdAt', '<', week.end))
  const [activitySnapshot, ...taskSnapshots] = await Promise.all([
    getDocsFromServer(activityInPeriod),
    ...groupIds.map(id => getDocsFromServer(query(collection(db, 'groups', id, 'tasks'), where('status', 'in', ['todo', 'doing'])))),
  ])

  const groupScope = new Set(groupIds)
  const events = activitySnapshot.docs.map(doc => doc.data())
    .filter(event => groupScope.has(event.groupId))
    .map(event => ({...event, completedAt: event.createdAt?.toDate()}))
  const tasks = taskSnapshots.flatMap((snapshot, index) => snapshot.docs.map(doc => ({
    ...doc.data(), id: doc.id, groupId: groupIds[index],
  })))
  return summarizeProgress(events, tasks, week, now)
}
