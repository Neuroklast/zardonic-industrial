import { SectionWrapper } from './SectionWrapper'

interface Gig {
  id: string
  title: string
  venue: string | null
  city: string | null
  country: string | null
  event_date: string
  ticket_url: string | null
  festival_name: string | null
}

interface GigsSectionProps {
  upcoming: Gig[]
  past: Gig[]
}

function GigRow({ gig }: { gig: Gig }) {
  const date = new Date(gig.event_date)
  const dateStr = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const location = [gig.city, gig.country].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-4 border-b border-zinc-800/60">
      <span className="font-mono text-xs text-zinc-500 w-32 shrink-0">{dateStr}</span>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-sm text-zinc-200 truncate">
          {gig.festival_name ?? gig.title}
        </p>
        {gig.venue && (
          <p className="font-mono text-xs text-zinc-500 truncate">
            {gig.venue}
            {location && ` · ${location}`}
          </p>
        )}
      </div>
      {gig.ticket_url && (
        <a
          href={gig.ticket_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 font-mono text-xs tracking-widest uppercase border border-zinc-700 hover:border-zinc-400 text-zinc-400 hover:text-zinc-200 px-3 py-1 transition-colors"
        >
          Tickets
        </a>
      )}
    </div>
  )
}

export function GigsSection({ upcoming, past }: GigsSectionProps) {
  if (upcoming.length === 0 && past.length === 0) return null

  return (
    <SectionWrapper id="events" heading="Events">
      {upcoming.length > 0 ? (
        <div className="mb-10">
          {upcoming.map((g) => (
            <GigRow key={g.id} gig={g} />
          ))}
        </div>
      ) : (
        <p className="font-mono text-xs text-zinc-600 mb-8">No upcoming events scheduled.</p>
      )}

      {past.length > 0 && (
        <details className="group">
          <summary className="font-mono text-xs tracking-widest text-zinc-600 uppercase cursor-pointer hover:text-zinc-400 transition-colors list-none">
            <span className="group-open:hidden">[ + ] Past events</span>
            <span className="hidden group-open:inline">[ − ] Past events</span>
          </summary>
          <div className="mt-4 opacity-60">
            {past.map((g) => (
              <GigRow key={g.id} gig={g} />
            ))}
          </div>
        </details>
      )}
    </SectionWrapper>
  )
}
