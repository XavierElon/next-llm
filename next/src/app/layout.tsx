import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextDevtoolsProvider } from '@next-devtools/core'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Lit Code X',
  description: 'Write Lit Code or Die Trying'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-[#1B1C1D] dark:text-white`} suppressHydrationWarning>
        <NextDevtoolsProvider>{children}</NextDevtoolsProvider>
      </body>
    </html>
  )
}
