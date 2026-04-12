export function parseTrackTitle(title: string) {
  const match = title.match(/^(.*?)\s*\(\s*f(?:ea)?t\.\s+(.+?)\)\s*$/i)
  if (match) {
    // Split by comma or " & " or " and "
    const artists = match[2].split(/\s*(?:,|\s+&\s+|\s+and\s+)\s*/i).map(s => s.trim()).filter(Boolean)
    return {
      cleanTitle: match[1].trim(),
      extractedArtists: artists
    }
  }
  return { cleanTitle: title, extractedArtists: [] }
}
