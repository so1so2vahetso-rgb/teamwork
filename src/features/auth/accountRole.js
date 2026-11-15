// Display hint only. Server Rules must confirm the admin permission separately.
export function accountRole(user, adminUid) {
  if (!user) return null
  return adminUid && user.uid === adminUid ? 'admin' : 'member'
}
