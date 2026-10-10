import { signOut } from 'aws-amplify/auth'
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { isSignedIn } from '../auth/session'
import { Wordmark } from '../ui/kit'

/** Shell for signed-in screens. Sends signed-out visitors to sign in, then back. */
export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState<'checking' | 'in' | 'out'>('checking')

  useEffect(() => {
    isSignedIn().then((ok) => setState(ok ? 'in' : 'out'))
  }, [])

  if (state === 'checking') {
    return <p className="p-6 text-sm text-graphite-300">Loading…</p>
  }
  if (state === 'out') {
    return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  async function onSignOut() {
    await signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16">
      <header className="flex items-center justify-between py-5">
        <Wordmark />
        <button type="button" onClick={onSignOut} className="text-sm text-graphite-300 hover:text-graphite-100">
          Sign out
        </button>
      </header>
      <Outlet />
    </div>
  )
}
