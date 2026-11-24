import assert from 'node:assert/strict'
import {test} from 'node:test'
import {getReportWeek, summarizeProgress} from './progressReportModel.js'

const now = new Date('2026-11-22T17:05:00Z')

test('weeks start on Monday in Vietnam, even when UTC is still Sunday', () => {
  const current = getReportWeek(now)
  assert.equal(current.start.toISOString(), '2026-11-22T17:00:00.000Z')
  assert.equal(current.end.toISOString(), '2026-11-29T17:00:00.000Z')
  assert.equal(getReportWeek(now, -1).end.getTime(), current.start.getTime())
})

test('completion counts unique tasks by group and keeps the latest completion in the period', () => {
  const makeEvent = (entityId, completedAt, overrides = {}) => ({
    entityType: 'task', action: 'status_changed', fromStatus: 'doing', toStatus: 'done',
    entityId, groupId: 'alpha', completedAt: new Date(completedAt), ...overrides,
  })
  const completed = [
    makeEvent('edge', '2026-11-22T16:59:59Z'),
    makeEvent('repeat', '2026-11-22T17:00:00Z'),
    makeEvent('repeat', '2026-11-25T03:00:00Z', {assigneeName: 'Bình'}),
    makeEvent('repeat', '2026-11-24T03:00:00Z', {groupId: 'beta'}),
    makeEvent('edited', '2026-11-23T03:00:00Z', {action: 'updated', fromStatus: 'done'}),
    makeEvent('edge', '2026-11-29T17:00:00Z'),
  ]
  const {finished, overdue} = summarizeProgress(completed, [], getReportWeek(now), now)
  assert.deepEqual(finished.map(item => [item.groupId, item.entityId, item.assigneeName]), [
    ['alpha', 'repeat', 'Bình'], ['beta', 'repeat', undefined],
  ])
  assert.deepEqual(overdue, [])
})

test('overdue is based on Vietnam today independently of the selected reporting week', () => {
  const tasks = [
    {id: 'yesterday', status: 'doing', dueDate: '2026-11-22', archived: false},
    {id: 'older', status: 'todo', dueDate: '2026-11-20', archived: false},
    {id: 'today', status: 'todo', dueDate: '2026-11-23', archived: false},
    {id: 'done', status: 'done', dueDate: '2026-11-21', archived: false},
    {id: 'archived', status: 'todo', dueDate: '2026-11-21', archived: true},
  ]
  assert.deepEqual(summarizeProgress([], tasks, getReportWeek(now, -1), now).overdue.map(task => task.id), ['older', 'yesterday'])
})
