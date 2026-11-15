const channelName = 'teamwork-session'

// Messages contain no identity, credentials or tokens. Each tab clears its own
// Firebase session rather than only hiding the logged-in interface.
export function notifySignedOut() {
  if (typeof window === 'undefined' || !window.BroadcastChannel) return
  const channel = new BroadcastChannel(channelName)
  channel.postMessage('signed-out')
  channel.close()
}

export function listenForSignOut(clearSession) {
  if (typeof window === 'undefined' || !window.BroadcastChannel) return
  const channel = new BroadcastChannel(channelName)
  channel.onmessage = event => {
    if (event.data !== 'signed-out') return
    clearSession().catch(() => {
      window.dispatchEvent(new Event('teamwork-session-sync-error'))
    })
  }
}
