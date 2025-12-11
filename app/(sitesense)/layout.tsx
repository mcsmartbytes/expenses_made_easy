import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SiteSense',
  description: 'Track jobs, crew time, and costs.',
  openGraph: {
    title: 'SiteSense',
    siteName: 'SiteSense',
  },
}

export default function SiteSenseLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement
}

