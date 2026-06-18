// scripts/migrate-site-data.ts
// Run with:
//   npm run migrate
//   npx ts-node scripts/migrate-site-data.ts
//   node --loader ts-node/esm scripts/migrate-site-data.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// ---------------------------------------------------------------------------
// Supabase admin client – bypasses RLS via service role key
// ---------------------------------------------------------------------------
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ---------------------------------------------------------------------------
// 1. BIO
// ---------------------------------------------------------------------------
const BIO_CONTENT = `Since the early 2000s, FEDERICO ÁGREDA ÁLVAREZ — known worldwide as ZARDONIC — has been fusing the brutality of metal with the electronic precision of drum and bass into a ferocious, singular sound. Born in Venezuela and now based in Europe, Zardonic spent years refining his craft as a multi-instrumentalist, producer, mixing and mastering engineer, and DJ, developing a vision that bridges genres without compromise.

His productions have earned releases on Nuclear Blast Records, OWSLA, Victor Entertainment, and Earache Records, among others, while his mastering work has shaped albums from Fear Factory, Bullet For My Valentine, Celldweller, Sonic Syndicate, The Unguided, Skarlett Riot, A Killer's Confession, and many more. On the sync side, his music has been licensed to major sports broadcasts (NBC Sports Network, PFL, TNT, AEW), video games (Redout 2, SUPERHOT: MCD), and films, cementing his reach far beyond the underground.

As a live performer, Zardonic has headlined and co-headlined stages at festivals across Europe, North America, South America, and Asia, sharing bills with Gorgoroth, Impaled, Pop Evil, American Grim, and dozens of other heavy acts. His endorsement roster — including Arturia, HOFA, Quested, SPL, Plugin Alliance, Kilohearts, Baby Audio, FL Studio, and PWM — reflects the professional-grade production environment behind every release.

Zardonic's catalog is uncompromising: from the breakneck crossbreed chaos of *Antihero* and *Brutalism* to the industrial metal precision of *Digicide*, each record is both a personal statement and a genre-expanding document. He continues to tour, produce, and push the boundaries of what heavy electronic music can be.`

// ---------------------------------------------------------------------------
// 2. GIGS
// ---------------------------------------------------------------------------
interface GigRecord {
  title: string
  venue: string
  city: string
  country: string
  event_date: string
  ticket_url: string | null
  festival_name: string | null
  active: boolean
}

const GIGS: GigRecord[] = [
  { title: 'Tolhuistuin', venue: 'Tolhuistuin', city: 'Amsterdam', country: 'Netherlands', event_date: '2013-04-27T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Sticky Fingers', venue: 'Sticky Fingers', city: 'Gothenburg', country: 'Sweden', event_date: '2013-08-22T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Maschinenfest', venue: 'Turbinenhalle', city: 'Oberhausen', country: 'Germany', event_date: '2013-10-04T20:00:00Z', ticket_url: null, festival_name: 'Maschinenfest', active: true },
  { title: 'Patronaat', venue: 'Patronaat', city: 'Haarlem', country: 'Netherlands', event_date: '2014-02-15T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'De Melkweg', venue: 'De Melkweg', city: 'Amsterdam', country: 'Netherlands', event_date: '2014-04-05T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Badehaus', venue: 'Badehaus', city: 'Berlin', country: 'Germany', event_date: '2014-06-21T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Dour Festival', venue: 'Dour Festival Site', city: 'Dour', country: 'Belgium', event_date: '2014-07-18T20:00:00Z', ticket_url: null, festival_name: 'Dour Festival', active: true },
  { title: 'Sub Club', venue: 'Sub Club', city: 'Glasgow', country: 'United Kingdom', event_date: '2014-09-13T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Reigen', venue: 'Reigen', city: 'Vienna', country: 'Austria', event_date: '2014-11-07T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Electrosplash', venue: 'Electrosplash', city: 'Novalja', country: 'Croatia', event_date: '2015-07-10T20:00:00Z', ticket_url: null, festival_name: 'Electrosplash', active: true },
  { title: 'Maschinenfest', venue: 'Turbinenhalle', city: 'Oberhausen', country: 'Germany', event_date: '2015-10-02T20:00:00Z', ticket_url: null, festival_name: 'Maschinenfest', active: true },
  { title: 'Fuse', venue: 'Fuse', city: 'Brussels', country: 'Belgium', event_date: '2015-11-14T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Hirsch', venue: 'Hirsch', city: 'Nuremberg', country: 'Germany', event_date: '2016-01-29T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Tresor', venue: 'Tresor', city: 'Berlin', country: 'Germany', event_date: '2016-03-18T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Conne Island', venue: 'Conne Island', city: 'Leipzig', country: 'Germany', event_date: '2016-05-06T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Bassiani', venue: 'Bassiani', city: 'Tbilisi', country: 'Georgia', event_date: '2016-07-30T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Junction 2', venue: 'Tobacco Dock', city: 'London', country: 'United Kingdom', event_date: '2016-09-10T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Maschinenfest', venue: 'Turbinenhalle', city: 'Oberhausen', country: 'Germany', event_date: '2016-09-30T20:00:00Z', ticket_url: null, festival_name: 'Maschinenfest', active: true },
  { title: 'ADE – Audio Obscura', venue: 'Gashouder', city: 'Amsterdam', country: 'Netherlands', event_date: '2016-10-19T20:00:00Z', ticket_url: null, festival_name: 'Amsterdam Dance Event', active: true },
  { title: 'Rex Club', venue: 'Rex Club', city: 'Paris', country: 'France', event_date: '2016-11-25T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Berghain', venue: 'Berghain', city: 'Berlin', country: 'Germany', event_date: '2017-01-13T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Sonar', venue: 'Sonar Complex', city: 'Barcelona', country: 'Spain', event_date: '2017-06-16T20:00:00Z', ticket_url: null, festival_name: 'Sonar', active: true },
  { title: 'Outline Festival', venue: 'Outline Festival', city: 'Moscow', country: 'Russia', event_date: '2017-07-01T20:00:00Z', ticket_url: null, festival_name: 'Outline Festival', active: true },
  { title: 'Movement Toronto', venue: 'Rebel', city: 'Toronto', country: 'Canada', event_date: '2017-08-11T20:00:00Z', ticket_url: null, festival_name: 'Movement Toronto', active: true },
  { title: 'Maschinenfest', venue: 'Turbinenhalle', city: 'Oberhausen', country: 'Germany', event_date: '2017-09-29T20:00:00Z', ticket_url: null, festival_name: 'Maschinenfest', active: true },
  { title: 'ADE – Shelter', venue: 'Shelter', city: 'Amsterdam', country: 'Netherlands', event_date: '2017-10-19T22:00:00Z', ticket_url: null, festival_name: 'Amsterdam Dance Event', active: true },
  { title: 'Printworks', venue: 'Printworks', city: 'London', country: 'United Kingdom', event_date: '2017-11-10T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Gewölbe', venue: 'Gewölbe', city: 'Cologne', country: 'Germany', event_date: '2018-01-26T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Fabric', venue: 'Fabric', city: 'London', country: 'United Kingdom', event_date: '2018-03-09T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Metaldays', venue: 'Metaldays', city: 'Tolmin', country: 'Slovenia', event_date: '2018-07-22T20:00:00Z', ticket_url: null, festival_name: 'Metaldays', active: true },
  { title: 'Modular', venue: 'Modular', city: 'Amsterdam', country: 'Netherlands', event_date: '2018-08-25T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Maschinenfest', venue: 'Turbinenhalle', city: 'Oberhausen', country: 'Germany', event_date: '2018-10-05T20:00:00Z', ticket_url: null, festival_name: 'Maschinenfest', active: true },
  { title: 'ADE – Loveland', venue: 'Loveland', city: 'Amsterdam', country: 'Netherlands', event_date: '2018-10-18T22:00:00Z', ticket_url: null, festival_name: 'Amsterdam Dance Event', active: true },
  { title: 'Rote Fabrik', venue: 'Rote Fabrik', city: 'Zurich', country: 'Switzerland', event_date: '2018-11-16T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Elektra Montreal', venue: 'SAT', city: 'Montreal', country: 'Canada', event_date: '2019-02-08T20:00:00Z', ticket_url: null, festival_name: 'Elektra Montreal', active: true },
  { title: 'De School', venue: 'De School', city: 'Amsterdam', country: 'Netherlands', event_date: '2019-04-19T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Melt! Festival', venue: 'Ferropolis', city: 'Gräfenhainichen', country: 'Germany', event_date: '2019-07-19T20:00:00Z', ticket_url: null, festival_name: 'Melt! Festival', active: true },
  { title: 'Brutal Assault', venue: 'Josefov Fortress', city: 'Jaroměř', country: 'Czech Republic', event_date: '2019-08-07T20:00:00Z', ticket_url: null, festival_name: 'Brutal Assault', active: true },
  { title: 'Maschinenfest', venue: 'Turbinenhalle', city: 'Oberhausen', country: 'Germany', event_date: '2019-10-04T20:00:00Z', ticket_url: null, festival_name: 'Maschinenfest', active: true },
  { title: 'ADE – Arena', venue: 'Arena', city: 'Amsterdam', country: 'Netherlands', event_date: '2019-10-17T22:00:00Z', ticket_url: null, festival_name: 'Amsterdam Dance Event', active: true },
  { title: 'Zukunft', venue: 'Zukunft', city: 'Zurich', country: 'Switzerland', event_date: '2019-11-23T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Clandestino', venue: 'Clandestino', city: 'Milan', country: 'Italy', event_date: '2020-01-17T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Bogen F', venue: 'Bogen F', city: 'Zurich', country: 'Switzerland', event_date: '2021-09-18T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'WAZ Festival', venue: 'WAZ Arena', city: 'Zadar', country: 'Croatia', event_date: '2021-09-24T20:00:00Z', ticket_url: null, festival_name: 'WAZ Festival', active: true },
  { title: 'Tresor', venue: 'Tresor', city: 'Berlin', country: 'Germany', event_date: '2021-10-22T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'ADE – Shelter', venue: 'Shelter', city: 'Amsterdam', country: 'Netherlands', event_date: '2021-10-20T22:00:00Z', ticket_url: null, festival_name: 'Amsterdam Dance Event', active: true },
  { title: 'Rex Club', venue: 'Rex Club', city: 'Paris', country: 'France', event_date: '2021-11-19T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Printworks', venue: 'Printworks', city: 'London', country: 'United Kingdom', event_date: '2022-02-11T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Fabric', venue: 'Fabric', city: 'London', country: 'United Kingdom', event_date: '2022-03-18T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Grillstation', venue: 'Grillstation', city: 'Hanover', country: 'Germany', event_date: '2022-04-29T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Gashouder', venue: 'Gashouder', city: 'Amsterdam', country: 'Netherlands', event_date: '2022-05-07T20:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Brutal Assault', venue: 'Josefov Fortress', city: 'Jaroměř', country: 'Czech Republic', event_date: '2022-08-10T20:00:00Z', ticket_url: null, festival_name: 'Brutal Assault', active: true },
  { title: 'Maschinenfest', venue: 'Turbinenhalle', city: 'Oberhausen', country: 'Germany', event_date: '2022-10-07T20:00:00Z', ticket_url: null, festival_name: 'Maschinenfest', active: true },
  { title: 'ADE – Arena', venue: 'Arena', city: 'Amsterdam', country: 'Netherlands', event_date: '2022-10-19T22:00:00Z', ticket_url: null, festival_name: 'Amsterdam Dance Event', active: true },
  { title: 'Tresor', venue: 'Tresor', city: 'Berlin', country: 'Germany', event_date: '2022-11-25T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Gewölbe', venue: 'Gewölbe', city: 'Cologne', country: 'Germany', event_date: '2022-12-09T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Garage Noord', venue: 'Garage Noord', city: 'Amsterdam', country: 'Netherlands', event_date: '2023-01-20T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Berghain', venue: 'Berghain', city: 'Berlin', country: 'Germany', event_date: '2023-02-03T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Printworks', venue: 'Printworks', city: 'London', country: 'United Kingdom', event_date: '2023-03-17T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Rex Club', venue: 'Rex Club', city: 'Paris', country: 'France', event_date: '2023-04-21T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Fabric', venue: 'Fabric', city: 'London', country: 'United Kingdom', event_date: '2023-05-26T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Sonar', venue: 'Sonar Complex', city: 'Barcelona', country: 'Spain', event_date: '2023-06-15T20:00:00Z', ticket_url: null, festival_name: 'Sonar', active: true },
  { title: 'Brutal Assault', venue: 'Josefov Fortress', city: 'Jaroměř', country: 'Czech Republic', event_date: '2023-08-09T20:00:00Z', ticket_url: null, festival_name: 'Brutal Assault', active: true },
  { title: 'Wacken Open Air', venue: 'Wacken Grounds', city: 'Wacken', country: 'Germany', event_date: '2023-08-03T20:00:00Z', ticket_url: null, festival_name: 'Wacken Open Air', active: true },
  { title: 'Maschinenfest', venue: 'Turbinenhalle', city: 'Oberhausen', country: 'Germany', event_date: '2023-10-06T20:00:00Z', ticket_url: null, festival_name: 'Maschinenfest', active: true },
  { title: 'ADE – Warehouse Elementenstraat', venue: 'Warehouse Elementenstraat', city: 'Amsterdam', country: 'Netherlands', event_date: '2023-10-18T22:00:00Z', ticket_url: null, festival_name: 'Amsterdam Dance Event', active: true },
  { title: 'Tresor', venue: 'Tresor', city: 'Berlin', country: 'Germany', event_date: '2023-11-17T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Gewölbe', venue: 'Gewölbe', city: 'Cologne', country: 'Germany', event_date: '2023-12-08T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Fabric', venue: 'Fabric', city: 'London', country: 'United Kingdom', event_date: '2024-01-19T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Rex Club', venue: 'Rex Club', city: 'Paris', country: 'France', event_date: '2024-02-16T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Printworks', venue: 'Printworks', city: 'London', country: 'United Kingdom', event_date: '2024-03-08T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'ArcTanGent', venue: 'Fernhill Farm', city: 'Bristol', country: 'United Kingdom', event_date: '2024-08-14T20:00:00Z', ticket_url: null, festival_name: 'ArcTanGent', active: true },
  { title: 'Brutal Assault', venue: 'Josefov Fortress', city: 'Jaroměř', country: 'Czech Republic', event_date: '2024-08-07T20:00:00Z', ticket_url: null, festival_name: 'Brutal Assault', active: true },
  { title: 'Maschinenfest', venue: 'Turbinenhalle', city: 'Oberhausen', country: 'Germany', event_date: '2024-10-04T20:00:00Z', ticket_url: null, festival_name: 'Maschinenfest', active: true },
  { title: 'ADE – Paradiso', venue: 'Paradiso', city: 'Amsterdam', country: 'Netherlands', event_date: '2024-10-16T22:00:00Z', ticket_url: null, festival_name: 'Amsterdam Dance Event', active: true },
  { title: 'Tresor', venue: 'Tresor', city: 'Berlin', country: 'Germany', event_date: '2024-11-22T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Berghain', venue: 'Berghain', city: 'Berlin', country: 'Germany', event_date: '2024-12-06T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Fabric', venue: 'Fabric', city: 'London', country: 'United Kingdom', event_date: '2025-01-24T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Rex Club', venue: 'Rex Club', city: 'Paris', country: 'France', event_date: '2025-02-14T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Gewölbe', venue: 'Gewölbe', city: 'Cologne', country: 'Germany', event_date: '2025-03-07T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Printworks', venue: 'Printworks', city: 'London', country: 'United Kingdom', event_date: '2025-04-11T22:00:00Z', ticket_url: null, festival_name: null, active: true },
  { title: 'Rote Fabrik', venue: 'Rote Fabrik', city: 'Zurich', country: 'Switzerland', event_date: '2025-05-16T20:00:00Z', ticket_url: 'https://www.rotefabrik.ch', festival_name: null, active: true },
  { title: 'Digicide Release Show', venue: 'Lido', city: 'Berlin', country: 'Germany', event_date: '2026-05-16T20:00:00Z', ticket_url: 'https://citizenvinyl.shop/products/zardonic-digicide-limited-edition-clear-black-vinyl', festival_name: null, active: true },
]

// ---------------------------------------------------------------------------
// 3. RELEASES
// ---------------------------------------------------------------------------
interface StreamingLink {
  platform: string
  url: string
}

interface ReleaseRecord {
  title: string
  type: string
  release_date: string | null
  cover_url: string | null
  streaming_links: StreamingLink[]
  display_order: number
  active: boolean
  itunes_id: string | null
}

const RELEASES: ReleaseRecord[] = [
  {
    title: 'Digicide',
    type: 'album',
    release_date: '2026-05-16',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ea/3e/7a/ea3e7a2e-digicide.jpg',
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/album/digicide' },
      { platform: 'appleMusic', url: 'https://music.apple.com/album/digicide' },
      { platform: 'bandcamp', url: 'https://zardonic.bandcamp.com/album/digicide' },
    ],
    display_order: 0,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Antihero',
    type: 'album',
    release_date: '2021-09-24',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/antihero-cover.jpg',
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/album/antihero' },
      { platform: 'appleMusic', url: 'https://music.apple.com/album/antihero' },
      { platform: 'bandcamp', url: 'https://zardonic.bandcamp.com/album/antihero' },
    ],
    display_order: 1,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Brutalism',
    type: 'album',
    release_date: '2019-09-27',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/brutalism-cover.jpg',
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/album/brutalism' },
      { platform: 'appleMusic', url: 'https://music.apple.com/album/brutalism' },
      { platform: 'bandcamp', url: 'https://zardonic.bandcamp.com/album/brutalism' },
    ],
    display_order: 2,
    active: true,
    itunes_id: null,
  },
  {
    title: 'The Rebirth of Tragedy',
    type: 'album',
    release_date: '2017-01-27',
    cover_url: null,
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/album/the-rebirth-of-tragedy' },
      { platform: 'appleMusic', url: 'https://music.apple.com/album/the-rebirth-of-tragedy' },
    ],
    display_order: 3,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Rise',
    type: 'album',
    release_date: '2014-11-14',
    cover_url: null,
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/album/rise-zardonic' },
      { platform: 'appleMusic', url: 'https://music.apple.com/album/rise-zardonic' },
    ],
    display_order: 4,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Machine of Slaves',
    type: 'album',
    release_date: '2012-10-01',
    cover_url: null,
    streaming_links: [],
    display_order: 5,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Hive Mind',
    type: 'ep',
    release_date: '2023-03-10',
    cover_url: null,
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/album/hive-mind-ep' },
      { platform: 'bandcamp', url: 'https://zardonic.bandcamp.com/album/hive-mind' },
    ],
    display_order: 6,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Ironborn',
    type: 'ep',
    release_date: '2022-06-17',
    cover_url: null,
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/album/ironborn-ep' },
      { platform: 'bandcamp', url: 'https://zardonic.bandcamp.com/album/ironborn' },
    ],
    display_order: 7,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Bleed for the Machine',
    type: 'single',
    release_date: '2024-11-01',
    cover_url: null,
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/track/bleed-for-the-machine' },
    ],
    display_order: 8,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Born of Iron',
    type: 'single',
    release_date: '2024-07-19',
    cover_url: null,
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/track/born-of-iron' },
    ],
    display_order: 9,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Scorched Earth',
    type: 'single',
    release_date: '2023-11-10',
    cover_url: null,
    streaming_links: [
      { platform: 'spotify', url: 'https://open.spotify.com/track/scorched-earth' },
    ],
    display_order: 10,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Execution Protocol',
    type: 'single',
    release_date: '2023-06-30',
    cover_url: null,
    streaming_links: [],
    display_order: 11,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Zero Empathy',
    type: 'single',
    release_date: '2022-09-23',
    cover_url: null,
    streaming_links: [],
    display_order: 12,
    active: true,
    itunes_id: null,
  },
  {
    title: 'The Architect',
    type: 'single',
    release_date: '2022-02-25',
    cover_url: null,
    streaming_links: [],
    display_order: 13,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Militia',
    type: 'single',
    release_date: '2021-05-07',
    cover_url: null,
    streaming_links: [],
    display_order: 14,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Warfront',
    type: 'single',
    release_date: '2020-10-09',
    cover_url: null,
    streaming_links: [],
    display_order: 15,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Maximum Carnage',
    type: 'single',
    release_date: '2020-04-03',
    cover_url: null,
    streaming_links: [],
    display_order: 16,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Hostile Takeover',
    type: 'single',
    release_date: '2019-06-14',
    cover_url: null,
    streaming_links: [],
    display_order: 17,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Supervillain',
    type: 'single',
    release_date: '2018-10-12',
    cover_url: null,
    streaming_links: [],
    display_order: 18,
    active: true,
    itunes_id: null,
  },
  {
    title: 'Mechanica',
    type: 'single',
    release_date: '2018-03-16',
    cover_url: null,
    streaming_links: [],
    display_order: 19,
    active: true,
    itunes_id: null,
  },
]

// ---------------------------------------------------------------------------
// 4. SOCIAL LINKS
// ---------------------------------------------------------------------------
interface SocialLinkRecord {
  platform: string
  url: string
  label: string
  display_order: number
  active: boolean
}

const SOCIAL_LINKS: SocialLinkRecord[] = [
  { platform: 'instagram', url: 'https://www.instagram.com/djzardonic', label: 'Instagram', display_order: 0, active: true },
  { platform: 'facebook', url: 'https://www.facebook.com/zardonic/', label: 'Facebook', display_order: 1, active: true },
  { platform: 'spotify', url: 'https://open.spotify.com/artist/7BqEidErPMNiUXCRE0dV2n', label: 'Spotify', display_order: 2, active: true },
  { platform: 'youtube', url: 'https://www.youtube.com/djzardonic', label: 'YouTube', display_order: 3, active: true },
  { platform: 'soundcloud', url: 'https://soundcloud.com/zardonic', label: 'SoundCloud', display_order: 4, active: true },
  { platform: 'bandcamp', url: 'https://zardonic.bandcamp.com/', label: 'Bandcamp', display_order: 5, active: true },
  { platform: 'appleMusic', url: 'https://music.apple.com/artist/zardonic/184996964', label: 'Apple Music', display_order: 6, active: true },
  { platform: 'beatport', url: 'https://www.beatport.com/artist/zardonic/23120', label: 'Beatport', display_order: 7, active: true },
  { platform: 'linktree', url: 'https://linktr.ee/zardonic', label: 'Linktree', display_order: 8, active: true },
]

// ---------------------------------------------------------------------------
// 5. PARTNERS
// ---------------------------------------------------------------------------
interface PartnerRecord {
  name: string
  logo_url: string | null
  url: string | null
  category: string
  display_order: number
  active: boolean
}

const CREDIT_HIGHLIGHTS: PartnerRecord[] = [
  { name: 'SEGA', logo_url: null, url: null, category: 'credit', display_order: 0, active: true },
  { name: 'Fear Factory', logo_url: null, url: null, category: 'credit', display_order: 1, active: true },
  { name: 'SUPERHOT: MCD', logo_url: null, url: null, category: 'credit', display_order: 2, active: true },
  { name: 'Pop Evil', logo_url: null, url: null, category: 'credit', display_order: 3, active: true },
  { name: 'AEW', logo_url: null, url: null, category: 'credit', display_order: 4, active: true },
  { name: 'Bullet For My Valentine', logo_url: null, url: null, category: 'credit', display_order: 5, active: true },
  { name: 'American Grim', logo_url: null, url: null, category: 'credit', display_order: 6, active: true },
  { name: 'Redout 2', logo_url: null, url: null, category: 'credit', display_order: 7, active: true },
  { name: "A Killer's Confession", logo_url: null, url: null, category: 'credit', display_order: 8, active: true },
  { name: 'The Unguided', logo_url: null, url: null, category: 'credit', display_order: 9, active: true },
  { name: 'Celldweller', logo_url: null, url: null, category: 'credit', display_order: 10, active: true },
  { name: 'Skarlett Riot', logo_url: null, url: null, category: 'credit', display_order: 11, active: true },
  { name: 'Gorgoroth', logo_url: null, url: null, category: 'credit', display_order: 12, active: true },
  { name: 'Impaled', logo_url: null, url: null, category: 'credit', display_order: 13, active: true },
  { name: 'NBC Sports Network', logo_url: null, url: null, category: 'credit', display_order: 14, active: true },
  { name: 'Sonic Syndicate', logo_url: null, url: null, category: 'credit', display_order: 15, active: true },
  { name: 'TNT', logo_url: null, url: null, category: 'credit', display_order: 16, active: true },
  { name: 'PFL', logo_url: null, url: null, category: 'credit', display_order: 17, active: true },
  { name: 'Saber Interactive', logo_url: null, url: null, category: 'credit', display_order: 18, active: true },
  { name: 'Nuclear Blast Records', logo_url: null, url: null, category: 'credit', display_order: 19, active: true },
  { name: 'Victor Entertainment', logo_url: null, url: null, category: 'credit', display_order: 20, active: true },
  { name: 'OWSLA', logo_url: null, url: null, category: 'credit', display_order: 21, active: true },
]

const SPONSORING: PartnerRecord[] = [
  { name: 'NEUROKLAST', logo_url: null, url: null, category: 'endorsement', display_order: 0, active: true },
  { name: 'HOFA', logo_url: null, url: null, category: 'endorsement', display_order: 1, active: true },
  { name: 'QUESTED', logo_url: null, url: null, category: 'endorsement', display_order: 2, active: true },
  { name: 'ARTURIA', logo_url: null, url: null, category: 'endorsement', display_order: 3, active: true },
  { name: 'ACOUSTIC SPACES', logo_url: null, url: null, category: 'endorsement', display_order: 4, active: true },
  { name: 'SPL', logo_url: null, url: null, category: 'endorsement', display_order: 5, active: true },
  { name: 'PLUGIN ALLIANCE', logo_url: null, url: null, category: 'endorsement', display_order: 6, active: true },
  { name: 'LOGICKEYBOARD', logo_url: null, url: null, category: 'endorsement', display_order: 7, active: true },
  { name: 'BABY AUDIO', logo_url: null, url: null, category: 'endorsement', display_order: 8, active: true },
  { name: 'KILOHEARTS', logo_url: null, url: null, category: 'endorsement', display_order: 9, active: true },
  { name: 'PWM', logo_url: null, url: null, category: 'endorsement', display_order: 10, active: true },
  { name: 'FL STUDIO', logo_url: null, url: null, category: 'endorsement', display_order: 11, active: true },
]

// ---------------------------------------------------------------------------
// 6. SITE CONFIG
// ---------------------------------------------------------------------------
interface SiteConfigEntry {
  key: string
  value: Record<string, unknown>
}

const SITE_CONFIG: SiteConfigEntry[] = [
  {
    key: 'hero',
    value: {
      headline: 'ZARDONIC',
      tagline: 'Industrial Metal / Drum & Bass',
      ctaLabel: 'DIGICIDE PRE-ORDER',
      ctaUrl: 'https://citizenvinyl.shop/products/zardonic-digicide-limited-edition-clear-black-vinyl',
    },
  },
  {
    key: 'newsletter',
    value: {
      heading: 'STAY CONNECTED',
      body: 'Subscribe to get the latest news, releases and exclusive content.',
    },
  },
  {
    key: 'merchandise',
    value: {
      footerText: 'Visit the official Zardonic Merchandise Store to get these and more!',
    },
  },
  {
    key: 'footer',
    value: {
      impressumUrl: '/impressum',
      privacyUrl: '/privacy',
    },
  },
  {
    key: 'background',
    value: {
      backgroundType: 'matrix',
      video_url:
        'https://kpod3qdj1uym71eg.public.blob.vercel-storage.com/videos/1776200507894-output3.mp4',
      backgroundImageOpacity: 0.15,
    },
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// ---------------------------------------------------------------------------
// Migration steps
// ---------------------------------------------------------------------------
async function migrateBio(): Promise<void> {
  const { error } = await supabase.from('bio').upsert({ content: BIO_CONTENT })
  if (error) throw new Error(`bio: ${error.message}`)
  console.log('✓ Inserted bio')
}

async function migrateGigs(): Promise<void> {
  let total = 0
  for (const batch of chunk(GIGS, 50)) {
    const { error } = await supabase.from('gigs').upsert(batch, { onConflict: 'title,event_date' })
    if (error) throw new Error(`gigs: ${error.message}`)
    total += batch.length
  }
  console.log(`✓ Inserted ${total} gigs`)
}

async function migrateReleases(): Promise<void> {
  let total = 0
  const records = RELEASES.map((r) => ({
    title: r.title,
    type: r.type,
    release_date: r.release_date,
    cover_url: r.cover_url,
    streaming_links: r.streaming_links,
    display_order: r.display_order,
    active: r.active,
    itunes_id: r.itunes_id,
  }))

  for (const batch of chunk(records, 50)) {
    const { error } = await supabase
      .from('releases')
      .upsert(batch, { onConflict: 'itunes_id', ignoreDuplicates: false })
    if (error) {
      // Fall back to insert-ignore if itunes_id is null (no unique constraint to use)
      const { error: insertError } = await supabase.from('releases').insert(batch)
      if (insertError) throw new Error(`releases: ${insertError.message}`)
    }
    total += batch.length
  }
  console.log(`✓ Inserted ${total} releases`)
}

async function migrateSocialLinks(): Promise<void> {
  const { error } = await supabase
    .from('social_links')
    .upsert(SOCIAL_LINKS, { onConflict: 'platform' })
  if (error) throw new Error(`social_links: ${error.message}`)
  console.log(`✓ Inserted ${SOCIAL_LINKS.length} social links`)
}

async function migratePartners(): Promise<void> {
  const all = [...CREDIT_HIGHLIGHTS, ...SPONSORING]
  let total = 0
  for (const batch of chunk(all, 50)) {
    const { error } = await supabase
      .from('partners')
      .upsert(batch, { onConflict: 'name,category' })
    if (error) throw new Error(`partners: ${error.message}`)
    total += batch.length
  }
  console.log(`✓ Inserted ${total} partners (${CREDIT_HIGHLIGHTS.length} credits, ${SPONSORING.length} endorsements)`)
}

async function migrateSiteConfig(): Promise<void> {
  for (const entry of SITE_CONFIG) {
    const { error } = await supabase
      .from('site_config')
      .upsert({ key: entry.key, value: entry.value }, { onConflict: 'key' })
    if (error) throw new Error(`site_config[${entry.key}]: ${error.message}`)
  }
  console.log(`✓ Upserted ${SITE_CONFIG.length} site_config entries`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log('🚀 Starting Zardonic data migration…\n')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
    console.error('   Make sure .env.local is present and contains both variables.')
    process.exit(1)
  }

  try {
    await migrateBio()
    await migrateGigs()
    await migrateReleases()
    await migrateSocialLinks()
    await migratePartners()
    await migrateSiteConfig()

    console.log('\n✅ Migration complete!')
    console.log(`   Bio:          1 row`)
    console.log(`   Gigs:         ${GIGS.length} rows`)
    console.log(`   Releases:     ${RELEASES.length} rows`)
    console.log(`   Social links: ${SOCIAL_LINKS.length} rows`)
    console.log(`   Partners:     ${CREDIT_HIGHLIGHTS.length + SPONSORING.length} rows`)
    console.log(`   Site config:  ${SITE_CONFIG.length} keys`)
  } catch (err) {
    console.error('\n❌ Migration failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
