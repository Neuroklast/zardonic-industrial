import Image from 'next/image'
import { SectionWrapper } from './SectionWrapper'

interface Release {
  id: string
  title: string
  type: string
  release_date: string | null
  coverUrl: string | null
  streamingLinks: Array<{ platform: string; url: string }>
}

interface ReleasesSectionProps {
  releases: Release[]
}

export function ReleasesSection({ releases }: ReleasesSectionProps) {
  if (releases.length === 0) return null
  return (
    <SectionWrapper id="releases" heading="Discography">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {releases.map((release) => (
          <div key={release.id} className="group flex flex-col gap-2">
            <div className="relative aspect-square bg-zinc-900 overflow-hidden border border-zinc-800 group-hover:border-zinc-600 transition-colors">
              {release.coverUrl ? (
                <Image
                  src={release.coverUrl}
                  alt={release.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-mono text-xs text-zinc-700">NO IMAGE</span>
                </div>
              )}
              {/* Streaming links overlay */}
              {release.streamingLinks.length > 0 && (
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 flex-wrap p-2">
                  {release.streamingLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] tracking-wide text-zinc-300 hover:text-white border border-zinc-600 hover:border-white px-2 py-0.5 transition-colors"
                    >
                      {link.platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <p className="font-mono text-xs text-zinc-300 truncate" title={release.title}>
              {release.title}
            </p>
            <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider">
              {release.type}
              {release.release_date && ` · ${release.release_date.slice(0, 4)}`}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
