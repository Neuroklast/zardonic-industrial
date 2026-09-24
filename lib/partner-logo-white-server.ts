import sharp from 'sharp'
import {
  logoRasterSize,
  PARTNER_LOGO_RASTER_MAX,
  processLogoToWhiteSilhouette,
  rewriteSvgForHiResRaster,
} from '@/lib/partner-logo-white'

export async function renderPartnerLogoWhitePng(
  input: ArrayBuffer | Buffer,
  looksSvg: boolean,
): Promise<Buffer> {
  let bytes = Buffer.isBuffer(input) ? input : Buffer.from(input)
  if (looksSvg) {
    const text = bytes.toString('utf8')
    if (!/<svg/i.test(text)) throw new Error('not svg')
    bytes = Buffer.from(rewriteSvgForHiResRaster(text), 'utf8')
  }

  const image = sharp(bytes, { failOn: 'none' })
  const meta = await image.metadata()
  const srcW = meta.width || PARTNER_LOGO_RASTER_MAX
  const srcH = meta.height || PARTNER_LOGO_RASTER_MAX
  const { width, height } = logoRasterSize(srcW, srcH)

  const { data, info } = await image
    .ensureAlpha()
    .resize(width, height, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  if (info.channels !== 4) throw new Error('expected rgba')

  const processed = processLogoToWhiteSilhouette({
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    width: info.width,
    height: info.height,
  })

  return sharp(Buffer.from(processed.data), {
    raw: { width: processed.width, height: processed.height, channels: 4 },
  })
    .png()
    .toBuffer()
}
