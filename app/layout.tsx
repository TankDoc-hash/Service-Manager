import type { Metadata, Viewport } from 'next'
import './globals.css'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'TankDOC Service Manager',
  description: 'Aquarium & Pond Cleaning Service Management — Bangalore',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        {/* Ambient bubbles */}
        <div className="bubbles" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bubble"
              style={{
                left: `${8 + i * 8}%`,
                width: `${3 + (i % 3)}px`,
                height: `${3 + (i % 3)}px`,
                animationDuration: `${8 + (i * 3) % 14}s`,
                animationDelay: `${(i * 1.3) % 8}s`,
              }}
            />
          ))}
        </div>

        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
