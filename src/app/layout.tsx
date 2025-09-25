import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Coloring2heal - Color Your Mood Calendar',
  description: 'Create stunning calendars with customizable templates and breathtaking designs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
          {children}
        </main>
      </body>
    </html>
  )
}