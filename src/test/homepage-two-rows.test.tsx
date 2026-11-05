import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { MusicHighlightsSection } from '@/app/_components/public/MusicHighlightsSection'
import { SoundpacksSection } from '@/app/_components/public/SoundpacksSection'

describe('compact homepage sections', () => {
  it('limits music previews to four desktop and two mobile tiles, with a browse link', () => {
    const highlights = Array.from({ length: 14 }, (_, index) => ({
      id: `video-${index}`,
      title: `Music ${index}`,
      youtube_url: `https://youtu.be/video${index}`,
      description: null,
    }))
    render(
      <LocaleProvider>
        <MusicHighlightsSection highlights={highlights} maxItems={48} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('link', { name: /show more, browse all 14 items/i }))
      .toHaveAttribute('href', '/music-highlights')
    expect(screen.queryByText('Music 4')).not.toBeInTheDocument()
    expect(screen.getByText('Music 2').parentElement).toHaveClass('hidden', 'md:flex')
    expect(screen.getByText('Music 3').parentElement).toHaveClass('hidden', 'md:flex')
    expect(screen.getByText('Music 1').parentElement).not.toHaveClass('hidden')
  })

  it('limits soundpack previews to two rows at 2/3/4 grid columns, with a browse link', () => {
    const items = Array.from({ length: 14 }, (_, index) => ({
      id: `pack-${index}`,
      title: `Pack ${index}`,
      imageUrl: null,
      externalUrl: null,
    }))
    render(
      <LocaleProvider>
        <SoundpacksSection items={items} maxItems={48} />
      </LocaleProvider>,
    )

    expect(screen.getByRole('link', { name: /show more, browse all 14 items/i }))
      .toHaveAttribute('href', '/soundpacks')
    expect(screen.queryByText('Pack 8')).not.toBeInTheDocument()
    expect(screen.getByText('Pack 4').closest('[aria-label="Pack 4"]'))
      .toHaveClass('hidden', 'sm:block')
    expect(screen.getByText('Pack 6').closest('[aria-label="Pack 6"]'))
      .toHaveClass('hidden', 'md:block')
    expect(screen.getByText('Pack 3').closest('[aria-label="Pack 3"]'))
      .not.toHaveClass('hidden')
  })
})
