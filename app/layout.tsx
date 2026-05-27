import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Campus Canteen | Campus Meals, Reimagined',
  description: 'Skip queues. Order instantly. Pay digitally. Collect with QR. The modern way to order campus food.',
  keywords: ['campus food', 'canteen', 'food ordering', 'college meals', 'digital payment', 'QR ordering'],
  authors: [{ name: 'Campus Canteen' }],
  openGraph: {
    title: 'Campus Canteen | Campus Meals, Reimagined',
    description: 'Skip queues. Order instantly. Pay digitally. Collect with QR.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF6B00',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        <Providers>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
