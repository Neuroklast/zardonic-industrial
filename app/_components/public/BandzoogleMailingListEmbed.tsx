'use client'

/**
 * Crops the existing Bandzoogle page to its mailing-list form.
 * The page is cross-origin: this does not alter the provider's form, consent,
 * validation, or subscription flow. Adjust the offsets if Bandzoogle changes
 * its layout. Cross-origin frame restrictions must be checked in a browser.
 */
const BANDZOOGLE_URL = 'https://zardonic.bandzoogle.com/'
const FRAME_WIDTH = 1100
const FRAME_HEIGHT = 1400
const FORM_TOP_OFFSET = 560

export function BandzoogleMailingListEmbed() {
  return (
    <div
      className="relative h-[92px] w-full max-w-[356px] overflow-hidden bg-black"
      aria-label="Official Zardonic mailing list"
      data-testid="bandzoogle-mailing-list-crop"
    >
      <iframe
        title="Join the official Zardonic mailing list"
        src={BANDZOOGLE_URL}
        loading="lazy"
        referrerPolicy="no-referrer"
        scrolling="no"
        className="absolute border-0"
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          left: '50%',
          top: -FORM_TOP_OFFSET,
          transform: 'translateX(-50%)',
        }}
      />
      <a
        href={BANDZOOGLE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="sr-only focus:not-sr-only focus:absolute focus:inset-x-0 focus:bottom-0 focus:z-10 focus:bg-black focus:p-2 focus:text-center focus:text-white"
      >
        Open the Zardonic mailing list directly
      </a>
    </div>
  )
}
