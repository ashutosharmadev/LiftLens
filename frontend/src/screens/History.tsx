import { signOut } from 'aws-amplify/auth'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getHistory, SignedOutError, type History as HistoryData, type HistoryItem } from '../api/client'
import { apiDeps } from '../auth/session'
import { BodyMap } from '../history/BodyMap'
import { changeSinceLast, scoredItems, sinceLastHeadline } from '../history/trend'
import { TrendChart } from '../history/TrendChart'
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

function shortDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function Row({ item }: { item: HistoryItem }) {
  const flagged = item.score.status === 'flagged'
  return (
    <li className={`border-b border-graphite-800 py-5 last:border-b-0 ${flagged ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-graphite-300">{formatDate(item.timestamp)}</span>
        <span className="rounded-full border border-graphite-700 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-graphite-300">
          {STATUS_LABEL[item.score.status]}
        </span>
      </div>
      <p className="mt-2 font-mono text-2xl font-medium">{item.shoulderToWaist.toFixed(2)}</p>
      <p className="mt-1 text-sm leading-relaxed text-graphite-300">{item.score.explanation}</p>
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
  const scored = data ? scoredItems(data.measurements) : []
  const since = data ? changeSinceLast(data.measurements) : null
  const baseline = data?.measurements.find((m) => m.isBaseline)?.shoulderToWaist ?? scored[0]?.shoulderToWaist

  return (
    <main className="space-y-8">
      <Viewfinder className="bg-graphite-900">
        <p className="font-mono text-xs uppercase tracking-wider text-graphite-300">Shoulder-to-waist</p>
        <p className="mt-2 font-mono text-5xl font-medium text-signal">{latest ? latest.shoulderToWaist.toFixed(2) : '—'}</p>
        {since && (
          <p className="mt-3">
            <span className="block font-mono text-base text-graphite-100">{sinceLastHeadline(since)}</span>
            <span className="block text-xs text-graphite-500">
              since last check-in · <span className="whitespace-nowrap">{shortDate(since.previous.timestamp)} → {shortDate(since.latest.timestamp)}</span>
            </span>
          </p>
        )}
        <p className="mt-2 text-sm text-graphite-300">
          {latest ? latest.score.explanation : 'Take your first check-in to set your baseline.'}
        </p>
        {latest && !since && (
          <p className="mt-2 text-sm text-graphite-500">Your trend appears after your next check-in.</p>
        )}
        <Link to="/check-in" className="mt-6 block">
          <Button tabIndex={-1}>New check-in</Button>
        </Link>
      </Viewfinder>

      {data && (
        <section className="rounded-md border border-graphite-800 bg-graphite-900 p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Body map</h2>
          <BodyMap ratio={scored.at(-1)?.shoulderToWaist ?? null} />
        </section>
      )}

      {scored.length >= 2 && baseline !== undefined && (
        <section className="rounded-md border border-graphite-800 bg-graphite-900 p-4 sm:p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Trend</h2>
            <span className="text-xs text-graphite-500">Shaded: ±2% noise around baseline</span>
          </div>
          <TrendChart items={scored} baseline={baseline} />
        </section>
      )}

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
