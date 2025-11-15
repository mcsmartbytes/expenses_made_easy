import './globals.css'

export const metadata = {
  title: 'Expenses Made Easy',
  description: 'Track your business and personal expenses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
