import { confirmResetPassword, resetPassword } from 'aws-amplify/auth'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { PASSWORD_RULES } from '../auth/amplify'
import { authErrorMessage } from '../auth/errors'
import { AuthPage, Button, Field, Notice } from '../ui/kit'

export function ForgotPassword() {
  const navigate = useNavigate()
  const [stage, setStage] = useState<'request' | 'confirm'>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function requestCode(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await resetPassword({ username: email.trim() })
      setStage('confirm')
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirm(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const username = email.trim()
      await confirmResetPassword({ username, confirmationCode: code.trim(), newPassword: password })
      navigate(`/signin?reset=1&email=${encodeURIComponent(username)}`, { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (stage === 'request') {
    return (
      <AuthPage title="Reset your password" subtitle="We’ll email you a code if the address has an account.">
        <form onSubmit={requestCode} className="space-y-4">
          {error && <Notice tone="error">{error}</Notice>}
          <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send code'}
          </Button>
        </form>
        <p className="mt-6 text-sm">
          <Link to="/signin" className="text-graphite-300 hover:text-graphite-100">
            Back to sign in
          </Link>
        </p>
      </AuthPage>
    )
  }

  return (
    <AuthPage title="Choose a new password" subtitle={`Enter the code sent to ${email.trim()}.`}>
      <form onSubmit={confirm} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <Field
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          hint={PASSWORD_RULES}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </Button>
      </form>
    </AuthPage>
  )
}
