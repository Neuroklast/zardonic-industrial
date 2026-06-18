import React, { memo, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SectionBase } from '@/components/sections/SectionBase'
import { MagnifyingGlassPlus, Trash, ArrowUp, ArrowDown, Plus, Upload } from '@phosphor-icons/react'
import EditableHeading from '@/components/EditableHeading'
import { toDirectImageUrl } from '@/lib/image-cache'
import type { SiteData } from '@/lib/app-types'
import type { AdminSettings } from '@/lib/types'
import { useImageUpload } from '@/cms/hooks/useImageUpload'

interface GallerySectionProps {
  siteData: SiteData
  editMode: boolean
  sectionOrder: number
  visible: boolean
  sectionLabel: string
  headingPrefix?: string
  setGalleryIndex: (index: number) => void
  adminSettings: AdminSettings | undefined
  /** Callback to persist gallery image array changes (only passed in editMode) */
  onUpdateGallery?: (gallery: string[]) => void
}

const COLUMNS_MAP: Record<string, string> = {
  '2': 'grid-cols-2',
  '3': 'grid-cols-2 md:grid-cols-3',
  '4': 'grid-cols-2 md:grid-cols-4',
}

const ASPECT_MAP: Record<string, string> = {
  'square': 'aspect-square',
  '16/9': 'aspect-video',
  'auto': 'aspect-auto',
}

function GallerySection({
  siteData,
  editMode,
  sectionOrder,
  visible,
  sectionLabel,
  headingPrefix,
  setGalleryIndex,
  adminSettings,
  onUpdateGallery,
}: GallerySectionProps) {
  const overrides = adminSettings?.sections?.styleOverrides?.gallery
  const columns = COLUMNS_MAP[overrides?.columns ?? ''] ?? 'grid-cols-2 md:grid-cols-3'
  const aspect = ASPECT_MAP[overrides?.aspectRatio ?? ''] ?? 'aspect-square'
  const gapValue = overrides?.gap ? `gap-[${overrides.gap}]` : 'gap-4'
  const lightbox = overrides?.lightbox !== false
  const maxVisible = overrides?.maxVisible

  const [showAll, setShowAll] = useState(false)
  const [addUrl, setAddUrl] = useState('')
  const { upload: uploadImage, isUploading } = useImageUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Combine manual gallery images and Instagram feed images
  const allImages = [
    ...siteData.gallery,
    ...(siteData.instagramFeed ?? []),
  ]

  const visibleImages = maxVisible && !showAll ? allImages.slice(0, maxVisible) : allImages

  const handleAddUrl = useCallback(() => {
    const trimmed = addUrl.trim()
    if (!trimmed || !onUpdateGallery) return
    onUpdateGallery([...siteData.gallery, trimmed])
    setAddUrl('')
  }, [addUrl, siteData.gallery, onUpdateGallery])

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onUpdateGallery) return
    const result = await uploadImage(file)
    if (result) onUpdateGallery([...siteData.gallery, result.url])
    e.target.value = ''
  }, [siteData.gallery, onUpdateGallery, uploadImage])

  const handleDelete = useCallback((index: number) => {
    if (!onUpdateGallery) return
    const updated = siteData.gallery.filter((_, i) => i !== index)
    onUpdateGallery(updated)
  }, [siteData.gallery, onUpdateGallery])

  const handleMove = useCallback((index: number, direction: -1 | 1) => {
    if (!onUpdateGallery) return
    const updated = [...siteData.gallery]
    const target = index + direction
    if (target < 0 || target >= updated.length) return
    ;[updated[index], updated[target]] = [updated[target], updated[index]]
    onUpdateGallery(updated)
  }, [siteData.gallery, onUpdateGallery])

  return (
    <SectionBase id="gallery" sectionOrder={sectionOrder} visible={visible} themeColor="card border primary">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, x: -30, filter: 'blur(10px)', clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-foreground font-mono hover-chromatic hover-glitch cyber2077-scan-build cyber2077-data-corrupt" data-text={`${headingPrefix ? headingPrefix + ' ' : ''}${sectionLabel || 'GALLERY'}`}>
              {headingPrefix && <span className="text-primary/70 mr-2">{headingPrefix}</span>}
              <EditableHeading onChange={() => {}}
                text={sectionLabel || ''}
                defaultText="GALLERY"
                editMode={editMode}
                glitchEnabled={adminSettings?.terminal?.glitchText?.enabled !== false}
                glitchIntervalMs={adminSettings?.terminal?.glitchText?.intervalMs}
                glitchDurationMs={adminSettings?.terminal?.glitchText?.durationMs}
              />
              {adminSettings?.background?.blinkingCursor !== false && <span className="animate-pulse">_</span>}
            </h2>
          </div>

          {/* Edit-mode image management toolbar */}
          {editMode && onUpdateGallery && (
            <div className="mb-6 flex flex-wrap gap-2 items-center p-3 border border-border/50 bg-card/30 rounded">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                aria-label="Upload image"
              >
                <Upload className="w-3 h-3 mr-1" />
                {isUploading ? 'Uploading…' : 'Upload'}
              </Button>
              <Input
                className="font-mono text-xs h-8 max-w-xs bg-card border-border"
                placeholder="Paste image URL…"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrl() }}
              />
              <Button
                size="sm"
                variant="outline"
                className="font-mono text-xs"
                onClick={handleAddUrl}
                disabled={!addUrl.trim()}
                aria-label="Add image by URL"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add URL
              </Button>
            </div>
          )}

          {allImages.length === 0 ? (
            <Card className="p-12 text-center bg-card/50 border-border">
              <p className="text-xl text-muted-foreground uppercase tracking-wide font-mono">
                Gallery coming soon
              </p>
            </Card>
          ) : (
            <>
              <div className={`grid ${columns} ${gapValue}`}>
                {visibleImages.map((image, index) => {
                  // In editMode, only manual gallery images are editable (instagramFeed is read-only)
                  const isManual = index < siteData.gallery.length
                  return (
                    <motion.div
                      key={`${image}-${index}`}
                      initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
                      whileInView={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.6,
                        delay: index * 0.08,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      className={`${aspect} bg-muted overflow-hidden relative group glitch-image${lightbox && !editMode ? ' cursor-pointer' : ''}`}
                      onClick={lightbox && !editMode ? () => setGalleryIndex(index) : undefined}
                    >
                      <img 
                        src={toDirectImageUrl(image) || image} 
                        alt={`Gallery ${index + 1}`} 
                        className="w-full h-full object-cover hover-chromatic-image" 
                        crossOrigin="anonymous"
                        loading="lazy"
                        decoding="async"
                      />
                      {lightbox && !editMode && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <MagnifyingGlassPlus className="w-8 h-8 text-foreground" />
                        </div>
                      )}
                      {editMode && onUpdateGallery && isManual && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 text-white hover:text-white hover:bg-white/20"
                            onClick={() => handleMove(index, -1)}
                            disabled={index === 0}
                            aria-label="Move image up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 text-white hover:text-white hover:bg-white/20"
                            onClick={() => handleMove(index, 1)}
                            disabled={index >= siteData.gallery.length - 1}
                            aria-label="Move image down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 text-red-400 hover:text-red-400 hover:bg-red-400/20"
                            onClick={() => handleDelete(index)}
                            aria-label="Delete image"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {maxVisible && allImages.length > maxVisible && !editMode && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    className="font-mono text-xs uppercase tracking-wider border-primary/50 hover:border-primary"
                    onClick={() => setShowAll(prev => !prev)}
                  >
                    {showAll ? 'Show Less' : `Show All (${allImages.length})`}
                  </Button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </SectionBase>
  )
}
export default memo(GallerySection)
