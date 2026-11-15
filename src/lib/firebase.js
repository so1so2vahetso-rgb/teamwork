import { readFirebaseConfig } from './firebaseConfig.js'
import { listenForSignOut } from '../features/auth/sessionSync.js'

// Missing config must not break the UI or silently target a demonstration project.
export const firebaseSetup = readFirebaseConfig(import.meta.env ?? {})
export const configuredAdminUid = (import.meta.env?.VITE_FIREBASE_ADMIN_UID ?? '').trim()

let clientsPromise

/** SDK initialization is lazy; it is not proof of a successful remote connection. */
export async function getFirebaseClients() {
  if (firebaseSetup.status !== 'ready') {
    throw new Error('Chưa có cấu hình Firebase hợp lệ. Xem docs/firebase-setup.md.')
  }
  if (!clientsPromise) {
    clientsPromise = (async () => {
      const [{ getApp, getApps, initializeApp }, { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence, signOut }, { getFirestore, connectFirestoreEmulator }] = await Promise.all([
        import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
      ])
      const useEmulators = import.meta.env?.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === 'true'
      const config = useEmulators ? { apiKey: 'demo-api-key', projectId: 'demo-teamwork', authDomain: 'localhost', appId: '1:123:web:demo' } : firebaseSetup.config
      const app = getApps().some(app => app.name === '[DEFAULT]') ? getApp() : initializeApp(config)
      const auth = getAuth(app), db = getFirestore(app)
      if (useEmulators) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
        connectFirestoreEmulator(db, '127.0.0.1', 8080)
      }
      await setPersistence(auth, browserLocalPersistence)
      listenForSignOut(() => signOut(auth))
      return { app, auth, db }
    })().catch(error => {
      clientsPromise = undefined
      throw error
    })
  }
  return clientsPromise
}
