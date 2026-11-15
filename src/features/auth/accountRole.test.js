import test from 'node:test'
import assert from 'node:assert/strict'
import { accountRole } from './accountRole.js'

test('only the configured UID is admin, regardless of client profile role', () => {
  assert.equal(accountRole({ uid: 'only-admin' }, 'only-admin'), 'admin')
  assert.equal(accountRole({ uid: 'member', role: 'admin' }, 'only-admin'), 'member')
  assert.equal(accountRole({ uid: 'member' }, ''), 'member')
  assert.equal(accountRole(null, 'only-admin'), null)
})
