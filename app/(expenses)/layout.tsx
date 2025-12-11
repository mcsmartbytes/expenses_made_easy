import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Expenses Made Easy',
  description: 'Supercharged expense tracking with budgets, receipts, and mileage.',
  openGraph: {
    title: 'Expenses Made Easy',
    siteName: 'Expenses Made Easy',
  },
}

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement
}

