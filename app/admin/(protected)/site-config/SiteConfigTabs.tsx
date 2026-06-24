'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HeroConfigEditor } from './HeroConfigEditor'
import { BackgroundConfigEditor } from './BackgroundConfigEditor'
import { AppearanceEditor } from './AppearanceEditor'
import { SimpleTextConfigEditor } from './SimpleTextConfigEditor'
import SiteConfigEditor from './SiteConfigEditor'
import { AdminPreviewPane } from '@/app/admin/_components/AdminPreviewPane'

type TabId = 'hero' | 'background' | 'appearance' | 'sections' | 'text' | 'advanced'

interface SiteConfigTabsProps {
  heroValue: Record<string, unknown>
  bgValue: Record<string, unknown>
  appearanceValue: Record<string, unknown>
  newsletterValue: Record<string, unknown>
  merchandiseValue: Record<string, unknown>
  footerValue: Record<string, unknown>
  advancedConfigs: Array<{
    key: string
    label: string
    description: string
    example: string
    currentValue: string
  }>
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'background', label: 'Background' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'sections', label: 'Sections' },
  { id: 'text', label: 'Footer & Legal' },
  { id: 'advanced', label: 'Advanced JSON' },
]

export function SiteConfigTabs({
  heroValue,
  bgValue,
  appearanceValue,
  newsletterValue,
  merchandiseValue,
  footerValue,
  advancedConfigs,
}: SiteConfigTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('appearance')

  return (
    <AdminPreviewPane>
      <div className="space-y-4" data-admin-ui="true">
        <nav className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-900/40 text-white border border-red-700/50'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'hero' && <HeroConfigEditor currentValue={heroValue} />}
        {activeTab === 'background' && <BackgroundConfigEditor currentValue={bgValue} />}
        {activeTab === 'appearance' && <AppearanceEditor currentValue={appearanceValue} />}
        {activeTab === 'sections' && (
          <div className="border border-zinc-800 rounded p-4 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Page Sections</h2>
            <p className="text-xs text-zinc-500">
              Control which sections appear on the public site and their order.
            </p>
            <Link
              href="/admin/sections"
              className="inline-flex px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
            >
              Open Section Manager →
            </Link>
          </div>
        )}
        {activeTab === 'text' && (
          <div className="space-y-6">
            <SimpleTextConfigEditor
              configKey="newsletter"
              title="Newsletter Section"
              description="Heading and body text for the mailing list section."
              fields={[
                { key: 'heading', label: 'Heading', placeholder: 'Mailing List' },
                { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Subscribe for news and releases.' },
              ]}
              currentValue={newsletterValue}
            />
            <SimpleTextConfigEditor
              configKey="merchandise"
              title="Merchandise Section"
              description="Footer text shown below the merch grid."
              fields={[
                {
                  key: 'footerText',
                  label: 'Footer Text',
                  type: 'textarea',
                  placeholder: 'Visit the official store…',
                },
              ]}
              currentValue={merchandiseValue}
            />
            <SimpleTextConfigEditor
              configKey="footer"
              title="Footer Links"
              description="Legal Notice and Privacy Policy page paths."
              fields={[
                { key: 'legalNoticeUrl', label: 'Legal Notice URL', type: 'url', placeholder: '/legal-notice' },
                { key: 'privacyPolicyUrl', label: 'Privacy Policy URL', type: 'url', placeholder: '/privacy-policy' },
              ]}
              currentValue={footerValue}
            />
          </div>
        )}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <p className="text-xs text-zinc-500">
              Raw JSON editors for power users. Prefer the tabs above for everyday changes.
            </p>
            {advancedConfigs.map((item) => (
              <SiteConfigEditor
                key={item.key}
                configKey={item.key}
                label={item.label}
                description={item.description}
                example={item.example}
                currentValue={item.currentValue}
              />
            ))}
          </div>
        )}
      </div>
    </AdminPreviewPane>
  )
}