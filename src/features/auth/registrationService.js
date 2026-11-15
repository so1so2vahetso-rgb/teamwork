import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore'

function registrationError(code, cause) {
  return Object.assign(new Error(code, { cause }), { code })
}

export function createRegistrationService({ auth, db }) {
  async function readProfile() {
    await auth.authStateReady()
    if (!auth.currentUser) return null
    const snapshot = await getDocFromServer(doc(db, 'users', auth.currentUser.uid))
    return snapshot.exists() ? snapshot.data() : null
  }

  async function completeProfile(name) {
    const displayName = name.trim()
    if (!displayName || displayName.length > 80) throw registrationError('registration/invalid-name')
    const user = auth.currentUser
    if (!user?.email) throw registrationError('registration/no-session')
    const ref = doc(db, 'users', user.uid)
    // Auth and Firestore cannot share a transaction. Retry only this idempotent step.
    return runTransaction(db, async transaction => {
      const existing = await transaction.get(ref)
      if (existing.exists()) return existing.data()
      const profile = { uid: user.uid, email: user.email, displayName, role: 'member', createdAt: serverTimestamp() }
      transaction.set(ref, profile)
      return profile
    })
  }

  async function register({ name, email, password }) {
    const displayName = name.trim()
    if (!displayName || displayName.length > 80) throw registrationError('registration/invalid-name')
    await auth.authStateReady()
    if (auth.currentUser) throw registrationError('registration/session-active')
    const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
    try {
      await updateProfile(user, { displayName })
      await completeProfile(displayName)
    } catch (cause) {
      throw registrationError('registration/profile-incomplete', cause)
    }
    return { uid: user.uid, email: user.email, displayName }
  }
  return { register, readProfile, completeProfile }
}
