import { describe, expect, it } from 'vitest'
import { CRAWLER_BLOCKLIST, isBlockedCrawlerUserAgent } from '@/lib/crawler-blocklist'

describe('crawler blocklist', () => {
  it('blocks known robots-ignoring scrapers and AI trainers', () => {
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)')).toBe(true)
    expect(isBlockedCrawlerUserAgent('Bytespider/0.1')).toBe(true)
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (compatible; ClaudeBot/1.0)')).toBe(true)
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (compatible; CCBot/2.0)')).toBe(true)
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (compatible; MJ12bot/v1.4.8)')).toBe(true)
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (compatible; SemrushBot/7~bl)')).toBe(true)
    expect(isBlockedCrawlerUserAgent('PetalBot')).toBe(true)
  })

  it('allows legitimate search engines and link previews', () => {
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(false)
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(false)
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (compatible; DuckDuckGoBot/1.0)')).toBe(false)
    expect(isBlockedCrawlerUserAgent('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe(false)
    expect(isBlockedCrawlerUserAgent('Twitterbot/1.0')).toBe(false)
  })

  it('keeps real visitors and null UAs untouched', () => {
    expect(isBlockedCrawlerUserAgent(null)).toBe(false)
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36')).toBe(false)
    expect(isBlockedCrawlerUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1')).toBe(false)
    expect(isBlockedCrawlerUserAgent('')).toBe(false)
  })

  it('is case-insensitive and list is non-empty', () => {
    expect(CRAWLER_BLOCKLIST.length).toBeGreaterThan(0)
    expect(isBlockedCrawlerUserAgent('chatgpt-user/1 (for test)')).toBe(true)
    expect(isBlockedCrawlerUserAgent('CLAUDEBOT OVERRIDE')).toBe(true)
  })
})
