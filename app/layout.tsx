import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '画像URL共有',
  description: '画像をURLで共有するアプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
