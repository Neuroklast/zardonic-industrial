import { describe, expect, it } from 'vitest'
import { isNavItemActive, resolveActiveNavItem } from '@/app/admin/_config/nav-groups'

describe('nav-groups active matching', () => {
  it('prefers longest href match', () => {
    const active = resolveActiveNavItem('/admin/releases/sync')
    expect(active?.href).toBe('/admin/releases/sync')
    expect(active?.label).toBe('Catalogue Sync')
  })

  it('matches dashboard exactly only', () => {
    expect(resolveActiveNavItem('/admin')?.href).toBe('/admin')
    expect(resolveActiveNavItem('/admin/releases')?.href).toBe('/admin/releases')
  })

  it('isNavItemActive returns single active item', () => {
    const gallery = { href: '/admin/gallery', label: 'Gallery' }
    const dashboard = { href: '/admin', label: 'Dashboard', exact: true }
    expect(isNavItemActive('/admin/gallery/abc', gallery)).toBe(true)
    expect(isNavItemActive('/admin/gallery/abc', dashboard)).toBe(false)
  })
})