import { signOut } from 'aws-amplify/auth'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getHistory, SignedOutError, type History as HistoryData, type HistoryItem } from '../api/client'
import { apiDeps } from '../auth/session'
import { Button, Notice, Viewfinder } from '../ui/kit'

const STATUS_LABEL: Record<HistoryItem['score']['status'], string> = {
  baseline: 'Baseline',
  increased: 'Increased',
  decreased: 'Decreased',
  no_clear_change: 'No clear change',
  flagged: 'Flagged',
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function Row({ item }: { item: HistoryItem }) {
  const flagged = item.score.status === 'flagged'
  return (
    <li className={`border-b border-graphite-800 py-4 last:border-b-0 ${flagged ? 'opacity-50' : ''}`}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-graphite-300">{formatDate(item.timestamp)}</span>
        <span className="font-mono text-xs uppercase tracking-wider text-graphite-300">
          {STATUS_LABEL[item.score.status]}
        </span>
      </div>
      <p className="mt-1 font-mono text-2xl font-medium">{item.shoulderToWaist.toFixed(2)}</p>
      <p className="mt-1 text-sm text-graphite-100">{item.score.explanation}</p>
    </li>
  )
}

export function History() {
  const navigate = useNavigate()
  const [data, setData] = useState<HistoryData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getHistory(apiDeps)
      .then((history) => !cancelled && setData(history))
      .catch(async (err) => {
        if (cancelled) return
        if (err instanceof SignedOutError) {
          await signOut()
          navigate('/signin?expired=1&next=/history', { replace: true })
          return
        }
        setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  const latest = data?.measurements.at(-1)

  return (
    <main className="space-y-8">
      <Viewfinder className="bg-graphite-900">
        <p className="font-mono text-xs uppercase tracking-wider text-graphite-300">Shoulder-to-waist</p>
        <p className="mt-2 font-mono text-5xl font-medium text-signal">{latest ? latest.shoulderToWaist.toFixed(2) : '—'}</p>
        <p className="mt-2 text-sm text-graphite-300">
          {latest ? latest.score.explanation : 'Take your first check-in to set your baseline.'}
        </p>
        <Link to="/check-in" className="mt-6 block">
          <Button tabIndex={-1}>New check-in</Button>
        </Link>
      </Viewfinder>

      <section>
        <h2 className="text-lg font-semibold">History</h2>
        {error && (
          <div className="mt-3">
            <Notice tone="error">{error}</Notice>
          </div>
        )}
        {!data && !error && <p className="mt-3 text-sm text-graphite-300">Loading…</p>}
        {data && data.measurements.length === 0 && (
          <p className="mt-3 text-sm text-graphite-300">No check-ins yet.</p>
        )}
        {data && data.measurements.length > 0 && (
          <ul className="mt-2">
            {[...data.measurements].reverse().map((item) => (
              <Row key={item.timestamp} item={item} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
