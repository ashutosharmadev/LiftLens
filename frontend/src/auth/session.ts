import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'
import type { ApiDeps } from '../api/client'

/** The current ID token, refreshed by Amplify when it's near expiry. */
export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() ?? null
  } catch {
    return null
  }
}

export async function isSignedIn(): Promise<boolean> {
  try {
    await getCurrentUser()
    return true
  } catch {
    return false
  }
}

export const apiDeps: ApiDeps = { getIdToken, fetch: (...args) => fetch(...args) }
