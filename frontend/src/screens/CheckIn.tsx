import { Link } from 'react-router'
import { Viewfinder } from '../ui/kit'

/** Placeholder until the capture step is built (M3 step 2). */
export function CheckIn() {
  return (
    <main>
      <Viewfinder className="bg-graphite-900">
        <h1 className="text-2xl font-semibold">New check-in</h1>
        <p className="mt-2 text-sm text-graphite-300">The guided camera arrives in the next step.</p>
        <Link to="/history" className="mt-6 inline-block text-sm text-signal hover:underline">
          Back to history
        </Link>
      </Viewfinder>
    </main>
  )
}
