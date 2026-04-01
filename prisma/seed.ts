/**
 * Prisma Seed Script — creates default data for a fresh database.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Default SiteConfig
  await prisma.siteConfig.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      siteName: 'Zardonic',
      tagline: 'Industrial Metal / Electronic Artist',
      socialLinks: {
        spotify: '',
        youtube: '',
        instagram: '',
        twitter: '',
        facebook: '',
        bandcamp: '',
        soundcloud: '',
      },
      footerText: `© ${new Date().getFullYear()} Zardonic. All rights reserved.`,
    },
  })

  // Default Biography
  await prisma.biography.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      content: '<p>Biography content goes here.</p>',
      shortBio: 'Industrial Metal / Electronic Artist',
      photoUrls: [],
      isDraft: true,
    },
  })

  // Default Sections
  const defaultSections = [
    { type: 'hero', title: 'Hero', sortOrder: 0, enabled: true },
    { type: 'about', title: 'About', sortOrder: 1, enabled: true },
    { type: 'releases', title: 'Releases', sortOrder: 2, enabled: true },
    { type: 'tour', title: 'Tour', sortOrder: 3, enabled: true },
    { type: 'videos', title: 'Videos', sortOrder: 4, enabled: true },
    { type: 'newsletter', title: 'Newsletter', sortOrder: 5, enabled: true },
  ]

  for (const section of defaultSections) {
    await prisma.section.upsert({
      where: { id: `default-${section.type}` },
      update: {},
      create: {
        id: `default-${section.type}`,
        ...section,
        config: {},
        content: {},
        isDraft: false,
      },
    })
  }

  // Default Shell Members (8 slots)
  const defaultMembers = [
    { slotIndex: 0, name: 'Entity 01', role: 'entity', isActive: false },
    { slotIndex: 1, name: 'Entity 02', role: 'entity', isActive: false },
    { slotIndex: 2, name: 'Entity 03', role: 'entity', isActive: false },
    { slotIndex: 3, name: 'Entity 04', role: 'entity', isActive: false },
    { slotIndex: 4, name: 'Entity 05', role: 'entity', isActive: false },
    { slotIndex: 5, name: 'Entity 06', role: 'entity', isActive: false },
    { slotIndex: 6, name: 'Entity 07', role: 'entity', isActive: false },
    { slotIndex: 7, name: 'Engineer', role: 'engineer', isActive: false },
  ]

  for (const member of defaultMembers) {
    const existing = await prisma.shellMember.findUnique({ where: { slotIndex: member.slotIndex } })
    if (!existing) {
      await prisma.shellMember.create({
        data: { ...member, socialLinks: {} },
      })
    }
  }

  console.log('✅ Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
