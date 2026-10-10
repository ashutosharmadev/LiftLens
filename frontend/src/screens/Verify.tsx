import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { authErrorMessage } from '../auth/errors'
import { AuthPage, Button, Field, Notice } from '../ui/kit'

export function Verify() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const username = email.trim()
      await confirmSignUp({ username, confirmationCode: code.trim() })
      navigate(`/signin?verified=1&email=${encodeURIComponent(username)}`, { replace: true })
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setError('')
    setInfo('')
    try {
      await resendSignUpCode({ username: email.trim() })
      setInfo('A new code is on its way. Check your inbox and spam folder.')
    } catch (err) {
      setError(authErrorMessage(err))
    }
  }

  return (
    <AuthPage title="Confirm your email" subtitle="Enter the 6-digit code we emailed you.">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        {info && <Notice tone="info">{info}</Notice>}
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          label="Code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {busy ? 'Confirming…' : 'Confirm'}
        </Button>
        <Button type="button" variant="ghost" onClick={resend} disabled={!email}>
          Send a new code
        </Button>
      </form>
    </AuthPage>
  )
}
