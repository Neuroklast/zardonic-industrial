/**
 * Centralised API route path constants.
 *
 * Single source of truth for all client-side API endpoints.
 * Update the string here instead of hunting down every occurrence.
 */

export const API_ROUTES = {
  AUTH:                     '/api/auth',
  SESSION:                  '/api/session',
  ANALYTICS:                '/api/analytics',
  CONTACT:                  '/api/contact',
  NEWSLETTER:               '/api/newsletter',
  SUBSCRIBERS:              '/api/subscribers',
  KV:                       '/api/kv',
  HEALTH:                   '/api/health',
  SYNC:                     '/api/sync',
  GIGS_SYNC:                '/api/gigs-sync',
  RELEASES_ENRICH:          '/api/releases-enrich',
  RELEASES_ENRICH_SINGLE:   '/api/releases-enrich-single',
  RELEASES_ENRICH_STREAM:   '/api/releases-enrich-stream',
  RELEASES_ENRICHMENT_STATUS: '/api/releases-enrichment-status',
  TERMINAL:                 '/api/terminal',
  IMAGE_PROXY:              '/api/image-proxy',
  CMS_CONTENT:              '/api/cms/content',
  CMS_SECTIONS:             '/api/cms/sections',
  CMS_MEDIA:                '/api/cms/media',
  CMS_AUTOSAVE:             '/api/cms/autosave',
  CMS_PUBLISH:              '/api/cms/publish',
  CMS_IMAGE_UPLOAD_TOKEN:   '/api/cms/image-upload-token',
  CMS_VIDEO_UPLOAD_TOKEN:   '/api/cms/video-upload-token',
  SETLISTFM:                '/api/setlistfm',
} as const

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES]
