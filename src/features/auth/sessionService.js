import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDocFromServer } from 'firebase/firestore'
import { accountRole } from './accountRole.js'
import { notifySignedOut } from './sessionSync.js'

export function createSessionService({ auth }) {
  async function login({ email, password }) {
    const { user } = await signInWithEmailAndPassword(auth, email.trim(), password)
    return user
  }
  async function logout() {
    await signOut(auth)
    notifySignedOut()
  }
  return { login, logout }
}

export async function resolveAccountRole({ user, db, adminUid }) {
  if (accountRole(user, adminUid) !== 'admin') return user ? 'member' : null
  try {
    // No marker document needs to exist. A successful server read (including
    // not-found) proves the Rules accepted the configured admin UID.
    await getDocFromServer(doc(db, 'access', 'admin'))
    return 'admin'
  } catch (error) {
    if (error.code === 'permission-denied') return 'member'
    throw error
  }
}
