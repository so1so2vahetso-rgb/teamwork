const fields = {
  VITE_FIREBASE_API_KEY: 'apiKey',
  VITE_FIREBASE_AUTH_DOMAIN: 'authDomain',
  VITE_FIREBASE_PROJECT_ID: 'projectId',
  VITE_FIREBASE_APP_ID: 'appId',
}

/** Validate local setup only. Ready does not mean the server connection is verified. */
export function readFirebaseConfig(env) {
  const values = Object.fromEntries(Object.keys(fields).map(key => [key, String(env[key] ?? '').trim()]))
  const missing = Object.keys(fields).filter(key => !values[key])
  if (missing.length) return { status: 'missing', config: null, missing, invalid: [] }

  const validators = {
    VITE_FIREBASE_API_KEY: /^AIza[\w-]{35}$/,
    VITE_FIREBASE_AUTH_DOMAIN: /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    VITE_FIREBASE_PROJECT_ID: /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/,
    VITE_FIREBASE_APP_ID: /^1:\d+:web:[a-zA-Z0-9]+$/,
  }
  const invalid = Object.keys(fields).filter(key => !validators[key].test(values[key]))
  if (invalid.length) return { status: 'invalid', config: null, missing: [], invalid }
  const config = Object.fromEntries(Object.entries(fields).map(([key, field]) => [field, values[key]]))
  return { status: 'ready', config, missing: [], invalid: [] }
}
