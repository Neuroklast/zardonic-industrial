export function parseTrackTitle(title: string) {
  const regex = /^(.*?)\s*(?:\(\s*)?f(?:ea)?t\.?\s+([^()\[\]]+?)(?:\))?(\s*\[.*?\]|\s*\(.*?\))?\s*$/i
  const match = title.match(regex)
  if (match) {
    const cleanTitle = (match[1] + (match[3] || '')).trim()
    const artists = match[2].split(/\s*(?:,|\s+&\s+|\s+and\s+)\s*/i).map(s => s.trim()).filter(Boolean)
    return { cleanTitle, extractedArtists: artists }
  }
  return { cleanTitle: title, extractedArtists: [] }
}
