import { collection, doc, onSnapshot, query, where, runTransaction, serverTimestamp } from 'firebase/firestore'

const failure = code => Object.assign(new Error(code), { code })

function normalize(input) {
  const name = input.name.trim(), description = input.description.trim()
  if (!name || name.length > 80 || description.length > 500) throw failure('groups/invalid-input')
  return { name, description }
}

export function createGroupRepository({ db, auth }) {
  function actor() {
    if (!auth.currentUser) throw failure('groups/no-session')
    return auth.currentUser.uid
  }
  function log(transaction, id, data, action) {
    transaction.set(doc(db, 'activityLogs', `group_${id}_${data.version}`), {
      entityType: 'group', entityId: id, version: data.version, action,
      actorId: data.updatedBy, name: data.name, createdAt: serverTimestamp(),
    })
  }
  async function create(input) {
    const fields = normalize(input), uid = actor(), ref = doc(collection(db, 'groups'))
    await runTransaction(db, async transaction => {
      // A server read prevents an offline write from entering a pending queue.
      await transaction.get(ref)
      const data = { ...fields, archived: false, version: 1, createdBy: uid, updatedBy: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
      transaction.set(ref, data)
      log(transaction, ref.id, data, 'created')
    })
    return ref.id
  }
  async function change(id, input, expectedVersion, archive) {
    const uid = actor(), ref = doc(db, 'groups', id)
    const fields = archive ? null : normalize(input)
    await runTransaction(db, async transaction => {
      const snapshot = await transaction.get(ref)
      if (!snapshot.exists()) throw failure('groups/not-found')
      const previous = snapshot.data()
      if (previous.archived) throw failure('groups/archived')
      if (previous.version !== expectedVersion) throw failure('groups/conflict')
      const data = { ...previous, ...(fields ?? {}), archived: archive, version: previous.version + 1, updatedBy: uid, updatedAt: serverTimestamp() }
      transaction.set(ref, data)
      log(transaction, id, data, archive ? 'archived' : 'updated')
    })
  }
  function watch(onData, onError) {
    return onSnapshot(query(collection(db, 'groups'), where('archived', '==', false)), { includeMetadataChanges: true }, snapshot => {
      const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a,b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
      onData({ groups, serverConfirmed: !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites })
    }, onError)
  }
  return { create, update: (id,input,version) => change(id,input,version,false), archive: (id,version) => change(id,null,version,true), watch }
}
