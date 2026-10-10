import { Amplify } from 'aws-amplify'

/**
 * Point Amplify Auth at the LiftLens user pool. Sign-in uses SRP, so the
 * password itself never leaves the browser. Values come from .env.local
 * (see .env.example and scripts/write-env.sh).
 */
export function configureAuth(): void {
  const userPoolId = import.meta.env.VITE_USER_POOL_ID
  const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID
  if (!userPoolId || !userPoolClientId) {
    throw new Error('Missing VITE_USER_POOL_ID or VITE_USER_POOL_CLIENT_ID; see frontend/.env.example')
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
        signUpVerificationMethod: 'code',
      },
    },
  })
}

/** Cognito's password rules, shown on sign-up and reset (see infra/data/users.tf). */
export const PASSWORD_RULES = 'At least 12 characters, with an uppercase letter, a lowercase letter and a number.'
