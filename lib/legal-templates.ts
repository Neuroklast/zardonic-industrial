import type { LegalConfig, LegalSection } from '@/lib/legal-content'
import {
  formatServiceAddress,
  getDataControllerLabel,
  getResponsibleAddress,
  getResponsibleName,
} from '@/lib/legal-content'

export function buildLegalNoticeSections(config: LegalConfig): LegalSection[] {
  if (config.legalNoticeCustom) {
    return [{ id: 'custom', title: 'Legal Notice', paragraphs: [config.legalNoticeCustom] }]
  }

  const address = formatServiceAddress(config)
  const responsibleName = getResponsibleName(config)
  const responsibleAddress = getResponsibleAddress(config)

  const operatorLines: string[] = []
  if (address) operatorLines.push(address)
  if (config.phone) operatorLines.push(`Phone: ${config.phone}`)
  if (config.email) operatorLines.push(`Email: ${config.email}`)
  if (config.vatId) operatorLines.push(`VAT ID: ${config.vatId}`)

  const sections: LegalSection[] = [
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

  return sections
}

export function buildPrivacyPolicySections(config: LegalConfig): LegalSection[] {
  if (config.privacyPolicyCustom) {
    return [{ id: 'custom', title: 'Privacy Policy', paragraphs: [config.privacyPolicyCustom] }]
  }

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
        'We use Supabase (database and authentication for the admin area), Cloudflare R2 (media storage), and Resend (contact form email delivery) as processors. These providers process data only as necessary to operate the website.',
      ],
    },
    {
      id: 'controller',
      title: '3. Data controller and general information',
      paragraphs: [
        `The data controller for this website is: ${controller}.`,
        ...(address ? [`Postal address:\n${address}`] : []),
        'We take the protection of your personal data seriously and process it in accordance with the GDPR, the German BDSG, and the TTDSG.',
        'Unless a specific retention period is stated below, personal data is deleted when the purpose of processing no longer applies, or when you withdraw consent or request erasure, unless statutory retention obligations apply.',
        'Legal bases: Art. 6(1)(a) GDPR (consent), Art. 6(1)(b) GDPR (contract/pre-contractual measures), Art. 6(1)(c) GDPR (legal obligation), Art. 6(1)(f) GDPR (legitimate interests).',
      ],
    },
    {
      id: 'storage',
      title: '4. Browser storage, cookies, and local data',
      paragraphs: [
        'We store your cookie consent preferences in localStorage (key: zd-cookie-consent). This is technically necessary to remember your choice. Legal basis: Art. 6(1)(f) GDPR and § 25(2) TTDSG.',
        'Functional preferences (language, theme, sound mute state) may be stored in localStorage without consent because they are strictly necessary for your chosen experience. Legal basis: Art. 6(1)(f) GDPR.',
        'An IndexedDB image cache may store compressed images locally to improve performance. No personal profiles are created. Legal basis: Art. 6(1)(f) GDPR.',
        'If you consent to analytics in the cookie banner, we may store anonymised usage data locally and optionally aggregate it server-side. You can revoke consent at any time via "Cookie Preferences" in the footer.',
        'Admin authentication uses HttpOnly session cookies (Supabase). These are not set for regular visitors.',
      ],
    },
    {
      id: 'contact',
      title: '5. Contact form',
      paragraphs: [
        'When you submit our contact form, we process: name, email address, subject, and message.',
        'Your message is transmitted to us by email via Resend. We do not sell or share this data with third parties for marketing purposes.',
        'Legal basis: Art. 6(1)(b) GDPR (pre-contractual communication) or Art. 6(1)(f) GDPR (legitimate interest in responding to inquiries).',
        'Data is deleted after your request has been processed, unless statutory retention obligations require longer storage.',
      ],
    },
    {
      id: 'newsletter',
      title: '6. Newsletter',
      paragraphs: [
        'If you subscribe to our newsletter, we store your email address in our Supabase database together with a record of your consent and the subscription timestamp.',
        'Legal basis: Art. 6(1)(a) GDPR (consent). You may unsubscribe at any time by contacting us. Your data will be deleted upon unsubscription.',
      ],
    },
    {
      id: 'cdn',
      title: '7. Image CDN (wsrv.nl)',
      paragraphs: [
        'To improve loading speed, images may be delivered via wsrv.nl (Images.weserv.nl). When your browser requests an image, wsrv.nl may temporarily process your IP address to deliver the content.',
        'wsrv.nl does not set tracking cookies. Legal basis: Art. 6(1)(f) GDPR (legitimate interest in fast image delivery). More information: https://wsrv.nl',
      ],
    },
    {
      id: 'embeds',
      title: '8. Third-party embeds (Spotify, YouTube)',
      paragraphs: [
        'Embedded media players (Spotify, YouTube) are NOT loaded automatically. They only load after you explicitly click a load button (two-click method).',
        'When activated, your IP address and browser data may be transmitted to Spotify AB (Sweden) or Google/YouTube (USA). Legal basis: Art. 6(1)(a) GDPR (your explicit consent).',
        'Spotify privacy policy: https://www.spotify.com/legal/privacy-policy/',
        'Google privacy policy: https://policies.google.com/privacy',
      ],
    },
    {
      id: 'external-links',
      title: '9. External links and social media',
      paragraphs: [
        'Our footer contains links to external social media profiles. When you click these links, you leave our website and the respective third-party privacy policies apply.',
        'We have no control over third-party websites and accept no responsibility for their content or data processing.',
      ],
    },
    {
      id: 'transfers',
      title: '10. International data transfers',
      paragraphs: [
        'Some processors (Vercel, Resend, Google/YouTube) are located in the USA. Transfers are based on appropriate safeguards such as EU Standard Contractual Clauses where applicable.',
      ],
    },
    {
      id: 'rights',
      title: '11. Your rights',
      paragraphs: [
        'Under the GDPR you have the right to: access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20), and objection (Art. 21).',
        'If processing is based on consent, you may withdraw consent at any time without affecting the lawfulness of prior processing.',
        'You may lodge a complaint with a supervisory authority. In Germany, contact your local Landesdatenschutzbehörde.',
        'To exercise your rights, contact us using the email address in the Legal Notice.',
      ],
    },
  ]
}