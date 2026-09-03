/**
 * Edge-level bot shield (proxy.ts).
 *
 * These crawlers are known to flood public pages while ignoring robots.txt
 * (or the site owner wants them blocked for AI-training reasons). Blocking at
 * the edge with a cheap User-Agent substring check keeps them from ever
 * triggering a serverless render or a Supabase read — which is what exploded
 * postgREST egress (7.5 GB on 2026-09-01, ~2 MAU).
 *
 * Rule of thumb: only add UAs that are guaranteed non-legitimate for this
 * site. Legit search engines (Googlebot, Bingbot, DuckDuckGoBot, YandexBot,
 * Baiduspider) and link-preview agents (facebookexternalhit, Twitterbot,
 * Slackbot) must stay allowed or SEO/social previews break.
 */
export const CRAWLER_BLOCKLIST: readonly string[] = [
  // OpenAI / ChatGPT ecosystem
  'gptbot',
  'chatgpt-user',
  'oai-searchbot',
  'openai-webbot',
  // Anthropic / Claude
  'claudebot',
  'claude-web',
  'claude-search',
  'anthropic-ai',
  // Google AI-training / research crawlers
  'google-extended',
  // Common Crawl
  'ccbot',
  // Search & SEO scrapers (surplus value, flood risk)
  'bytespider',
  'petalbot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'timpix',
  // Hosted AI / embedded crawlers
  'amazonbot',
  'applebot-extended',
  'cohere-ai',
  'perplexitybot',
  'perplexity-user',
  'facebookbot',
]

/**
 * True when the user agent matches a blocked crawler.
 * Case-insensitive substring match; null/empty UA (curl, curl-like, interior
 * requests) is never blocked.
 */
export function isBlockedCrawlerUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return CRAWLER_BLOCKLIST.some((token) => ua.includes(token))
}
