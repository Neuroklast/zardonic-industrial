/**
 * News utility functions
 */

export function formatNewsDate(date: string): string {
  if (!date) return '---'
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    if (/^\d{4}-\d{2}$/.test(date)) {
      const [year, month] = date.split('-')
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      return `${monthNames[parseInt(month) - 1]} ${year}`
    }
    return date
  }
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
