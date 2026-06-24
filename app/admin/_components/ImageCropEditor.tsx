'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import CyberModalBackdrop from '@/components/CyberModalBackdrop'
import {
  clampCropState,
  computeDrawRect,
  DEFAULT_CROP_STATE,
  resolveEditorViewport,
  resolveOutputSize,
  type CropFitMode,
  type CropState,
} from '@/lib/image-crop-math'
import * as SliderPrimitive from '@radix-ui/react-slider'

export interface ImageCropEditorProps {
  open: boolean
  imageSrc: string
  mimeType?: string
  title?: string
  aspectRatio?: number | null
  fitMode?: CropFitMode
  maxOutputDimension?: number
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 3

export function ImageCropEditor({
  open,
  imageSrc,
  title = 'Adjust image',
  aspectRatio = null,
  fitMode = 'cover',
  maxOutputDimension = 2400,
  onCancel,
  onConfirm,
}: ImageCropEditorProps) {
  const [crop, setCrop] = useState<CropState>(DEFAULT_CROP_STATE)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [dragging, setDragging] = useState(false)
  const [exporting, setExporting] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const cropRef = useRef(crop)
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    cropRef.current = crop
  }, [crop])

  useEffect(() => {
    if (!open) return
    setCrop(DEFAULT_CROP_STATE)
    setImageSize({ width: 0, height: 0 })
  }, [open, imageSrc])

  const viewport = useMemo(
    () =>
      imageSize.width > 0
        ? resolveEditorViewport(imageSize.width, imageSize.height, aspectRatio ?? null)
        : { width: 320, height: 320 },
    [aspectRatio, imageSize.height, imageSize.width],
  )

  const drawRect =
    imageSize.width > 0
      ? computeDrawRect(imageSize.width, imageSize.height, viewport, crop, fitMode)
      : null

  const updateCrop = useCallback(
    (next: CropState) => {
      if (imageSize.width <= 0) {
        setCrop(next)
        return
      }
      setCrop(clampCropState(imageSize.width, imageSize.height, viewport, next, fitMode))
    },
    [fitMode, imageSize.height, imageSize.width, viewport],
  )

  function handlePointerDown(clientX: number, clientY: number) {
    setDragging(true)
    dragStart.current = { x: clientX, y: clientY, offsetX: crop.offsetX, offsetY: crop.offsetY }
  }

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragging) return
      const dx = clientX - dragStart.current.x
      const dy = clientY - dragStart.current.y
      updateCrop({
        ...cropRef.current,
        offsetX: dragStart.current.offsetX + dx,
        offsetY: dragStart.current.offsetY + dy,
      })
    },
    [dragging, updateCrop],
  )

  function handlePointerUp() {
    setDragging(false)
  }

  useEffect(() => {
    if (!dragging) return
    function onMove(e: PointerEvent) {
      handlePointerMove(e.clientX, e.clientY)
    }
    function onUp() {
      handlePointerUp()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, handlePointerMove])

  async function handleConfirm() {
    if (!drawRect || imageSize.width <= 0) return
    setExporting(true)
    try {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image for export'))
        img.src = imageSrc
      })

      const output = resolveOutputSize(viewport, maxOutputDimension)
      const canvas = document.createElement('canvas')
      canvas.width = output.width
      canvas.height = output.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      const scaleX = output.width / viewport.width
      const scaleY = output.height / viewport.height

      if (fitMode === 'contain') {
        ctx.clearRect(0, 0, output.width, output.height)
      } else {
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, output.width, output.height)
      }

      ctx.drawImage(
        img,
        drawRect.x * scaleX,
        drawRect.y * scaleY,
        drawRect.width * scaleX,
        drawRect.height * scaleY,
      )

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to export image'))),
          'image/png',
          0.92,
        )
      })
      onConfirm(blob)
    } finally {
      setExporting(false)
    }
  }

  return (
    <CyberModalBackdrop open={open}>
      <motion.div
        className="w-full max-w-lg flex flex-col rounded border border-zinc-700 bg-zinc-950 shadow-2xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        data-admin-ui="true"
      >
        <div className="border-b border-zinc-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Drag to reposition, zoom to crop. The image is optimized on upload.
          </p>
        </div>

        <div className="p-4 space-y-4">
          <div
            ref={viewportRef}
            className="relative mx-auto overflow-hidden rounded border border-zinc-700 bg-zinc-900 cursor-grab active:cursor-grabbing touch-none"
            style={{ width: viewport.width, height: viewport.height }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              handlePointerDown(e.clientX, e.clientY)
            }}
            role="img"
            aria-label="Image crop preview — drag to pan"
          >
            <img
              src={imageSrc}
              alt=""
              className="absolute max-w-none select-none pointer-events-none"
              style={
                drawRect
                  ? {
                      left: drawRect.x,
                      top: drawRect.y,
                      width: drawRect.width,
                      height: drawRect.height,
                    }
                  : { opacity: 0 }
              }
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget
                setImageSize({ width: el.naturalWidth, height: el.naturalHeight })
              }}
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs text-zinc-400 uppercase tracking-widest">
              <span>Zoom</span>
              <span className="font-mono text-zinc-300">{crop.scale.toFixed(2)}×</span>
            </label>
            <SliderPrimitive.Root
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={[crop.scale]}
              onValueChange={([value]) => updateCrop({ ...crop, scale: value })}
              className="relative flex h-5 w-full touch-none items-center"
            >
              <SliderPrimitive.Track className="relative h-1.5 grow rounded-full bg-zinc-800">
                <SliderPrimitive.Range className="absolute h-full rounded-full bg-red-700/80" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb
                className="block h-4 w-4 rounded-full border border-zinc-600 bg-zinc-200 shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                aria-label="Zoom"
              />
            </SliderPrimitive.Root>
          </div>

          <button
            type="button"
            onClick={() => updateCrop(DEFAULT_CROP_STATE)}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Center & reset zoom
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={exporting}
            className="px-3 py-1.5 text-xs rounded border border-zinc-700 text-zinc-400 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={exporting || imageSize.width <= 0}
            className="px-3 py-1.5 text-xs rounded bg-red-900/50 border border-red-800/60 text-white hover:bg-red-900/70 disabled:opacity-50"
          >
            {exporting ? 'Processing…' : 'Save & upload'}
          </button>
        </div>
      </motion.div>
    </CyberModalBackdrop>
  )
}