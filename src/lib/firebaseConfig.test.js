import test from 'node:test'
import assert from 'node:assert/strict'
import { readFirebaseConfig } from './firebaseConfig.js'

const valid = {
  VITE_FIREBASE_API_KEY: 'AIza' + 'a'.repeat(35),
  VITE_FIREBASE_AUTH_DOMAIN: 'teamwork-demo.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'teamwork-demo',
  VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef012345',
}

test('missing config is reported without crashing or initializing a fake project', () => {
  const result = readFirebaseConfig({})
  assert.equal(result.status, 'missing')
  assert.equal(result.config, null)
  assert.equal(result.missing.length, 4)
})

test('partial config does not count as ready', () => {
  const result = readFirebaseConfig({ VITE_FIREBASE_PROJECT_ID: 'teamwork-demo' })
  assert.equal(result.status, 'missing')
  assert.equal(result.config, null)
  assert.deepEqual(result.missing, ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_APP_ID'])
})

test('example placeholders and malformed config are rejected', () => {
  const result = readFirebaseConfig({ ...valid, VITE_FIREBASE_API_KEY: 'YOUR_API_KEY', VITE_FIREBASE_AUTH_DOMAIN: 'https://teamwork-demo.firebaseapp.com' })
  assert.equal(result.status, 'invalid')
  assert.equal(result.config, null)
  assert.ok(result.invalid.includes('VITE_FIREBASE_API_KEY'))
  assert.ok(result.invalid.includes('VITE_FIREBASE_AUTH_DOMAIN'))
})

test('valid config is trimmed and only supported fields reach the SDK', () => {
  const result = readFirebaseConfig({ ...valid, VITE_FIREBASE_PROJECT_ID: ' teamwork-demo ', ADMIN_PASSWORD: 'must-not-be-forwarded' })
  assert.equal(result.status, 'ready')
  assert.deepEqual(result.config, { apiKey: valid.VITE_FIREBASE_API_KEY, authDomain: valid.VITE_FIREBASE_AUTH_DOMAIN, projectId: 'teamwork-demo', appId: valid.VITE_FIREBASE_APP_ID })
  assert.ok(!JSON.stringify(result).includes('must-not-be-forwarded'))
})
