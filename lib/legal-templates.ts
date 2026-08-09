import type { LegalConfig, LegalSection } from '@/lib/legal-content'
import {
  formatServiceAddress,
  getDataControllerLabel,
  getResponsibleAddress,
  getResponsibleName,
} from '@/lib/legal-content'

/** Supported locales for legal document templates. */
export type LegalLocale = 'en' | 'de'

export function resolveLegalLocale(locale?: string | null): LegalLocale {
  if (!locale) return 'en'
  const base = locale.toLowerCase().split('-')[0]
  return base === 'de' ? 'de' : 'en'
}

export function legalNoticeTitle(locale: LegalLocale): string {
  return locale === 'de' ? 'Impressum' : 'Legal Notice'
}

export function privacyPolicyTitle(locale: LegalLocale): string {
  return locale === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy'
}

export function buildLegalNoticeSections(
  config: LegalConfig,
  locale: LegalLocale = 'en',
): LegalSection[] {
  if (config.legalNoticeCustom) {
    return [
      {
        id: 'custom',
        title: legalNoticeTitle(locale),
        paragraphs: [config.legalNoticeCustom],
      },
    ]
  }

  return locale === 'de' ? buildLegalNoticeDe(config) : buildLegalNoticeEn(config)
}

export function buildPrivacyPolicySections(
  config: LegalConfig,
  locale: LegalLocale = 'en',
): LegalSection[] {
  if (config.privacyPolicyCustom) {
    return [
      {
        id: 'custom',
        title: privacyPolicyTitle(locale),
        paragraphs: [config.privacyPolicyCustom],
      },
    ]
  }

  return locale === 'de' ? buildPrivacyDe(config) : buildPrivacyEn(config)
}

// ─── EN Legal Notice ─────────────────────────────────────────────────────────

function buildLegalNoticeEn(config: LegalConfig): LegalSection[] {
  const address = formatServiceAddress(config)
  const responsibleName = getResponsibleName(config)
  const responsibleAddress = getResponsibleAddress(config)

  const operatorLines: string[] = []
  if (address) operatorLines.push(address)
  if (config.phone) operatorLines.push(`Phone: ${config.phone}`)
  if (config.email) operatorLines.push(`Email: ${config.email}`)
  if (config.vatId) operatorLines.push(`VAT ID: ${config.vatId}`)

  return [
    {
      id: 'operator',
      title: 'Information pursuant to § 5 DDG (Digital Services Act)',
      paragraphs: operatorLines.length > 0
        ? operatorLines
        : ['Please configure operator details in the admin panel under Legal & Privacy.'],
    },
    {
      id: 'responsible',
      title: 'Responsible for editorial content pursuant to § 18 (2) MStV',
      paragraphs: [
        responsibleName || 'Please configure the responsible person in the admin panel.',
        ...(responsibleAddress ? [responsibleAddress] : []),
      ],
    },
    {
      id: 'dispute',
      title: 'EU dispute resolution',
      paragraphs: [
        'The European Commission provides a platform for online dispute resolution (ODR): https://ec.europa.eu/consumers/odr/. Our email address can be found above.',
        'We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board.',
      ],
    },
    {
      id: 'liability-content',
      title: 'Liability for content',
      paragraphs: [
        'As a service provider, we are responsible for our own content on these pages in accordance with § 7 (1) DDG and general laws. According to §§ 8 to 10 DDG, we are not obliged as a service provider to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.',
        'Obligations to remove or block the use of information under general laws remain unaffected. Liability in this regard is only possible from the time of knowledge of a specific infringement. Upon becoming aware of corresponding legal violations, we will remove such content immediately.',
      ],
    },
    {
      id: 'liability-links',
      title: 'Liability for links',
      paragraphs: [
        'Our website contains links to external third-party websites over whose content we have no control. Therefore, we cannot accept liability for this third-party content. The respective provider or operator of the linked pages is always responsible for their content.',
        'Linked pages were checked for possible legal violations at the time of linking. Illegal content was not recognisable at that time. Permanent monitoring of linked pages without concrete evidence of a violation is unreasonable. Upon notification of violations, we will remove such links immediately.',
      ],
    },
    {
      id: 'copyright',
      title: 'Copyright',
      paragraphs: [
        'The content and works on these pages created by the site operators are subject to German copyright law. Duplication, processing, distribution, and any form of exploitation beyond the scope of copyright law require the written consent of the respective author or creator.',
        'Downloads and copies of this page are only permitted for private, non-commercial use. Where content on this site was not created by the operator, third-party copyrights are respected and marked accordingly.',
      ],
    },
  ]
}

// ─── DE Legal Notice ─────────────────────────────────────────────────────────

function buildLegalNoticeDe(config: LegalConfig): LegalSection[] {
  const address = formatServiceAddress(config)
  const responsibleName = getResponsibleName(config)
  const responsibleAddress = getResponsibleAddress(config)

  const operatorLines: string[] = []
  if (address) operatorLines.push(address)
  if (config.phone) operatorLines.push(`Telefon: ${config.phone}`)
  if (config.email) operatorLines.push(`E-Mail: ${config.email}`)
  if (config.vatId) operatorLines.push(`USt-IdNr.: ${config.vatId}`)

  return [
    {
      id: 'operator',
      title: 'Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)',
      paragraphs: operatorLines.length > 0
        ? operatorLines
        : ['Bitte vervollständigen Sie die Betreiberangaben im Admin unter Legal & Privacy.'],
    },
    {
      id: 'responsible',
      title: 'Verantwortlich für journalistisch-redaktionelle Inhalte gemäß § 18 Abs. 2 MStV',
      paragraphs: [
        responsibleName || 'Bitte verantwortliche Person im Admin hinterlegen.',
        ...(responsibleAddress ? [responsibleAddress] : []),
      ],
    },
    {
      id: 'dispute',
      title: 'EU-Streitschlichtung',
      paragraphs: [
        'Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr/. Unsere E-Mail-Adresse finden Sie oben im Impressum.',
        'Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
      ],
    },
    {
      id: 'liability-content',
      title: 'Haftung für Inhalte',
      paragraphs: [
        'Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.',
        'Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben unberührt. Eine diesbezügliche Haftung ist erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.',
      ],
    },
    {
      id: 'liability-links',
      title: 'Haftung für Links',
      paragraphs: [
        'Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.',
        'Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.',
      ],
    },
    {
      id: 'copyright',
      title: 'Urheberrecht',
      paragraphs: [
        'Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.',
        'Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet und entsprechend gekennzeichnet.',
      ],
    },
  ]
}

// ─── EN Privacy ──────────────────────────────────────────────────────────────

function buildPrivacyEn(config: LegalConfig): LegalSection[] {
  const controller = getDataControllerLabel(config)
  const address = formatServiceAddress(config)

  return [
    {
      id: 'overview',
      title: '1. Data protection at a glance',
      paragraphs: [
        'The following information provides a simple overview of what happens to your personal data when you visit this website. Personal data is any data that can be used to identify you personally.',
        `Data processing on this website is carried out by the website operator: ${controller}.`,
        'Some data is collected because you provide it to us (e.g. contact form or newsletter). Other data is recorded automatically by our IT systems when you visit the website (e.g. browser type, operating system, or time of access).',
        'Optional analytics are only collected if you explicitly consent via the cookie banner. No third-party advertising or tracking cookies are used.',
      ],
    },
    {
      id: 'hosting',
      title: '2. Hosting and infrastructure',
      paragraphs: [
        'This website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you visit our website, personal data such as your IP address may be processed on Vercel servers. This may involve transfers to the USA. See Vercel\'s privacy policy: https://vercel.com/legal/privacy-policy',
        'The legal basis is Art. 6(1)(f) GDPR (legitimate interest in reliable website presentation).',
        'We use Supabase (database and authentication for the admin area), Cloudflare R2 (media storage), and Resend (contact form and newsletter email) as processors. Data processing agreements (DPAs) and storage regions should be configured in each provider dashboard. These providers process data only as necessary to operate the website.',
      ],
    },
    {
      id: 'controller',
      title: '3. Data controller and general information',
      paragraphs: [
        `The data controller for this website is: ${controller}.`,
        ...(address ? [`Postal address:\n${address}`] : []),
        'We process personal data in accordance with the GDPR, the German BDSG, and the TDDDG (Telecommunications Digital Services Data Protection Act).',
        'Unless a specific retention period is stated below, personal data is deleted when the purpose of processing no longer applies, or when you withdraw consent or request erasure, unless statutory retention obligations apply.',
        'Legal bases: Art. 6(1)(a) GDPR (consent), Art. 6(1)(b) GDPR (contract/pre-contractual measures), Art. 6(1)(c) GDPR (legal obligation), Art. 6(1)(f) GDPR (legitimate interests).',
      ],
    },
    {
      id: 'storage',
      title: '4. Browser storage, cookies, and local data',
      paragraphs: [
        'We store your cookie consent preferences in localStorage (key: zd-cookie-consent). This is technically necessary to remember your choice. Legal basis: Art. 6(1)(f) GDPR and § 25(2) TDDDG.',
        'Functional preferences (language, theme, sound mute state) may be stored in localStorage without analytics consent because they are strictly necessary for your chosen experience. Legal basis: Art. 6(1)(f) GDPR.',
        'An IndexedDB image cache may store compressed images locally to improve performance. No personal profiles are created. Legal basis: Art. 6(1)(f) GDPR.',
        'If you consent to analytics, we may store first-party usage events (page views, section views, clicks with relative coordinates) on our servers (Supabase table analytics_events). No advertising network is involved. Retention: events are kept for up to 90 days for reporting, then should be deleted or aggregated by the operator; you may request earlier erasure. You can revoke consent at any time via "Cookie Preferences" in the footer.',
        'Admin authentication uses HttpOnly session cookies (Supabase). These are not set for regular visitors.',
      ],
    },
    {
      id: 'contact',
      title: '5. Contact form',
      paragraphs: [
        'When you submit our contact form, we process: name, email address, subject, and message.',
        'Your message is transmitted to us by email via Resend (USA). We do not sell or share this data with third parties for marketing purposes. A privacy notice with a link to this policy is shown next to the form.',
        'Legal basis: Art. 6(1)(b) GDPR (pre-contractual communication) or Art. 6(1)(f) GDPR (legitimate interest in responding to inquiries).',
        'Data is deleted after your request has been processed, unless statutory retention obligations require longer storage.',
        'Public forms are rate-limited and protected against automated abuse (pseudonymised IP hashes may be stored briefly for security). Legal basis: Art. 6(1)(f) GDPR.',
      ],
    },
    {
      id: 'newsletter',
      title: '6. Newsletter',
      paragraphs: [
        'If you subscribe to our newsletter, we store your email address in our Supabase database together with a record of your consent and the subscription timestamp. Subscription requires double opt-in: after signing up you receive a confirmation email via Resend; your address is only added to the active mailing list after you click the confirmation link.',
        'Legal basis: Art. 6(1)(a) GDPR (consent). You may unsubscribe at any time using the unsubscribe link in any newsletter email or via /newsletter/unsubscribe on this website. Your data will be deleted upon unsubscription or upon request.',
        'Confirmation and unsubscribe links use signed tokens. Newsletter forms are rate-limited to prevent abuse.',
      ],
    },
    {
      id: 'news',
      title: '7. News and blog content',
      paragraphs: [
        'Public news posts are editorial content (title, text, optional cover image). Reading news does not require an account and does not create a personal profile.',
        'Cover images may be delivered via our media CDN (Cloudflare R2) or image proxy (wsrv.nl) as described below. Legal basis: Art. 6(1)(f) GDPR.',
      ],
    },
    {
      id: 'cdn',
      title: '8. Image CDN (wsrv.nl) and web fonts',
      paragraphs: [
        'To improve loading speed, images may be delivered via wsrv.nl (Images.weserv.nl). When your browser requests an image, wsrv.nl may temporarily process your IP address to deliver the content.',
        'wsrv.nl does not set tracking cookies. Legal basis: Art. 6(1)(f) GDPR (legitimate interest in fast image delivery). More information: https://wsrv.nl',
        'Default website fonts (Orbitron, Share Tech Mono, Space Mono) are self-hosted with the site build (next/font). If the site operator selects additional typefaces in Appearance, those may be loaded from Google Fonts when applied. Legal basis for optional remote fonts: Art. 6(1)(f) GDPR (presentation of the website as configured by the operator).',
      ],
    },
    {
      id: 'embeds',
      title: '9. Third-party embeds (Spotify, YouTube)',
      paragraphs: [
        'Embedded media players (Spotify, YouTube) are NOT loaded automatically. They only load after you explicitly click a load button (two-click method).',
        'When activated, your IP address and browser data may be transmitted to Spotify AB (Sweden) or Google/YouTube (USA). Legal basis: Art. 6(1)(a) GDPR (your explicit consent).',
        'Spotify privacy policy: https://www.spotify.com/legal/privacy-policy/',
        'Google privacy policy: https://policies.google.com/privacy',
      ],
    },
    {
      id: 'external-links',
      title: '10. External links and social media',
      paragraphs: [
        'Our footer and content may contain links to external social media profiles and stores. When you click these links, you leave our website and the respective third-party privacy policies apply.',
        'We have no control over third-party websites and accept no responsibility for their content or data processing.',
      ],
    },
    {
      id: 'transfers',
      title: '11. International data transfers',
      paragraphs: [
        'Some processors (Vercel, Cloudflare, Resend, Google/YouTube when embeds are activated, wsrv.nl) may process data outside the EU/EEA, including the USA. Transfers are based on appropriate safeguards such as EU Standard Contractual Clauses or an adequacy decision (e.g. EU-US Data Privacy Framework) where applicable. The operator should conclude DPAs with each processor.',
      ],
    },
    {
      id: 'rights',
      title: '12. Your rights',
      paragraphs: [
        'Under the GDPR you have the right to: access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20), and objection (Art. 21).',
        'If processing is based on consent, you may withdraw consent at any time without affecting the lawfulness of prior processing.',
        'You may lodge a complaint with a supervisory authority. In Germany, contact your local Landesdatenschutzbehörde.',
        'To exercise your rights, contact us using the email address in the Legal Notice / Impressum.',
      ],
    },
  ]
}

// ─── DE Privacy ──────────────────────────────────────────────────────────────

function buildPrivacyDe(config: LegalConfig): LegalSection[] {
  const controller = getDataControllerLabel(config)
  const address = formatServiceAddress(config)

  return [
    {
      id: 'overview',
      title: '1. Datenschutz auf einen Blick',
      paragraphs: [
        'Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.',
        `Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber: ${controller}.`,
        'Ein Teil der Daten wird erhoben, indem Sie uns diese mitteilen (z. B. Kontaktformular oder Newsletter). Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst (z. B. Browsertyp, Betriebssystem oder Uhrzeit des Seitenaufrufs).',
        'Optionale Analyse-/Nutzungsdaten werden nur erhoben, wenn Sie im Cookie-Banner ausdrücklich zustimmen. Es werden keine Werbe- oder Tracking-Cookies Dritter eingesetzt.',
      ],
    },
    {
      id: 'hosting',
      title: '2. Hosting und Infrastruktur',
      paragraphs: [
        'Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Beim Besuch der Website können personenbezogene Daten wie Ihre IP-Adresse auf Servern von Vercel verarbeitet werden; dies kann eine Übermittlung in die USA beinhalten. Datenschutzerklärung von Vercel: https://vercel.com/legal/privacy-policy',
        'Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer zuverlässigen Bereitstellung der Website).',
        'Als weitere Auftragsverarbeiter nutzen wir Supabase (Datenbank und Admin-Authentifizierung), Cloudflare R2 (Medien) und Resend (E-Mail für Kontakt und Newsletter). Auftragsverarbeitungsverträge (AVV/DPA) und Speicherregionen sind in den jeweiligen Anbieter-Dashboards zu konfigurieren.',
      ],
    },
    {
      id: 'controller',
      title: '3. Verantwortlicher und allgemeine Hinweise',
      paragraphs: [
        `Verantwortlicher für die Datenverarbeitung auf dieser Website ist: ${controller}.`,
        ...(address ? [`Postanschrift:\n${address}`] : []),
        'Wir verarbeiten personenbezogene Daten im Einklang mit der DSGVO, dem BDSG und dem TDDDG.',
        'Soweit nachfolgend keine spezielle Speicherdauer genannt wird, verbleiben personenbezogene Daten bei uns, bis der Zweck der Verarbeitung entfällt oder Sie Ihre Einwilligung widerrufen bzw. Löschung verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.',
        'Rechtsgrundlagen: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), lit. b (Vertrag/vorvertraglich), lit. c (rechtliche Verpflichtung), lit. f (berechtigte Interessen).',
      ],
    },
    {
      id: 'storage',
      title: '4. Browser-Speicher, Cookies und lokale Daten',
      paragraphs: [
        'Ihre Cookie-Einstellungen speichern wir in localStorage (Schlüssel: zd-cookie-consent). Das ist technisch erforderlich, um Ihre Wahl zu merken. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO und § 25 Abs. 2 TDDDG.',
        'Funktionale Einstellungen (Sprache, Theme, Ton) können ohne Analytics-Einwilligung in localStorage gespeichert werden, weil sie für die von Ihnen gewählte Nutzung erforderlich sind. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.',
        'Ein IndexedDB-Bildcache kann komprimierte Bilder lokal speichern, um die Performance zu verbessern. Es werden keine Personenprofile gebildet. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.',
        'Wenn Sie Analytics zustimmen, können wir First-Party-Nutzungsereignisse (Seitenaufrufe, Abschnittsansichten, Klicks mit relativen Koordinaten) auf unseren Servern speichern (Supabase-Tabelle analytics_events). Es ist kein Werbenetzwerk beteiligt. Speicherdauer: bis zu 90 Tage für Auswertungen, danach Löschung oder Aggregation durch den Betreiber; frühere Löschung auf Anfrage. Widerruf jederzeit über „Cookie-Einstellungen“ im Footer.',
        'Admin-Authentifizierung nutzt HttpOnly-Session-Cookies (Supabase). Für normale Besucher werden diese nicht gesetzt.',
      ],
    },
    {
      id: 'contact',
      title: '5. Kontaktformular',
      paragraphs: [
        'Wenn Sie unser Kontaktformular nutzen, verarbeiten wir: Name, E-Mail-Adresse, Betreff und Nachricht.',
        'Die Nachricht wird per E-Mail über Resend (USA) an uns übermittelt. Eine Weitergabe zu Marketingzwecken an Dritte findet nicht statt. Am Formular wird auf diese Datenschutzerklärung hingewiesen.',
        'Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Kommunikation) oder Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).',
        'Die Daten werden nach abschließender Bearbeitung Ihrer Anfrage gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.',
        'Formulare sind rate-limitiert; pseudonymisierte IP-Hashes können kurzzeitig zu Sicherheitszwecken gespeichert werden. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.',
      ],
    },
    {
      id: 'newsletter',
      title: '6. Newsletter',
      paragraphs: [
        'Bei Newsletter-Anmeldung speichern wir Ihre E-Mail-Adresse in unserer Supabase-Datenbank zusammen mit dem Einwilligungsnachweis und Zeitstempel. Es gilt Double-Opt-in: Nach der Anmeldung erhalten Sie eine Bestätigungs-E-Mail über Resend; erst nach Klick auf den Bestätigungslink wird die Adresse aktiv.',
        'Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Abmeldung jederzeit über den Abmeldelink in der E-Mail oder über /newsletter/unsubscribe. Nach Abmeldung bzw. auf Anfrage werden die Daten gelöscht.',
        'Bestätigungs- und Abmeldelinks nutzen signierte Tokens. Formulare sind rate-limitiert.',
      ],
    },
    {
      id: 'news',
      title: '7. News und redaktionelle Inhalte',
      paragraphs: [
        'Öffentliche News-Beiträge sind redaktionelle Inhalte. Das Lesen erfordert kein Konto und erzeugt kein Personenprofil.',
        'Titelbilder können über Cloudflare R2 oder den Bild-Proxy wsrv.nl ausgeliefert werden. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.',
      ],
    },
    {
      id: 'cdn',
      title: '8. Bild-CDN (wsrv.nl) und Webfonts',
      paragraphs: [
        'Zur Performance-Optimierung können Bilder über wsrv.nl ausgeliefert werden. Dabei kann Ihre IP-Adresse kurzzeitig verarbeitet werden.',
        'wsrv.nl setzt keine Tracking-Cookies. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO. Weitere Informationen: https://wsrv.nl',
        'Standard-Webfonts (Orbitron, Share Tech Mono, Space Mono) werden mit dem Website-Build self-hosted (next/font). Wählt der Betreiber unter Appearance weitere Schriften, können diese bei Anwendung von Google Fonts geladen werden. Rechtsgrundlage für optionale Remote-Fonts: Art. 6 Abs. 1 lit. f DSGVO (Darstellung der Website wie vom Betreiber konfiguriert).'
      ],
    },
    {
      id: 'embeds',
      title: '9. Drittanbieter-Embeds (Spotify, YouTube)',
      paragraphs: [
        'Eingebettete Media-Player (Spotify, YouTube) werden NICHT automatisch geladen. Sie laden erst nach explizitem Klick (Zwei-Klick-Lösung).',
        'Nach Aktivierung können IP-Adresse und Browserdaten an Spotify AB (Schweden) bzw. Google/YouTube (USA) übermittelt werden. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).',
        'Datenschutz Spotify: https://www.spotify.com/legal/privacy-policy/',
        'Datenschutz Google: https://policies.google.com/privacy',
      ],
    },
    {
      id: 'external-links',
      title: '10. Externe Links und Social Media',
      paragraphs: [
        'Footer und Inhalte können Links zu externen Social-Media-Profilen und Shops enthalten. Beim Anklicken verlassen Sie unsere Website; es gelten die Datenschutzbestimmungen der jeweiligen Anbieter.',
        'Wir haben keinen Einfluss auf Drittwebsites und übernehmen keine Verantwortung für deren Inhalte oder Datenverarbeitung.',
      ],
    },
    {
      id: 'transfers',
      title: '11. Internationale Datenübermittlungen',
      paragraphs: [
        'Einige Auftragsverarbeiter (Vercel, Cloudflare, Resend, Google/YouTube bei aktivierten Embeds, wsrv.nl) können Daten außerhalb der EU/des EWR verarbeiten, einschließlich der USA. Übermittlungen erfolgen auf Grundlage geeigneter Garantien wie EU-Standardvertragsklauseln oder eines Angemessenheitsbeschlusses (z. B. EU-US Data Privacy Framework), soweit anwendbar. Der Betreiber sollte mit jedem Auftragsverarbeiter einen AVV/DPA abschließen.',
      ],
    },
    {
      id: 'rights',
      title: '12. Ihre Rechte',
      paragraphs: [
        'Sie haben nach der DSGVO das Recht auf: Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21).',
        'Soweit die Verarbeitung auf Einwilligung beruht, können Sie diese jederzeit widerrufen, ohne die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung zu berühren.',
        'Sie können sich bei einer Aufsichtsbehörde beschweren. In Deutschland wenden Sie sich an Ihre zuständige Landesdatenschutzbehörde.',
        'Zur Ausübung Ihrer Rechte kontaktieren Sie uns über die E-Mail-Adresse im Impressum.',
      ],
    },
  ]
}
