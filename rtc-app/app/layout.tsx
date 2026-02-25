import './styles/global.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fluxy',
  description: 'Application Fluxy',
  icons: {
    icon: '/logo_fluxy.png',
    shortcut: '/logo_fluxy.png',
    apple: '/logo_fluxy.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}