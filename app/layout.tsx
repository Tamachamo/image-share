import './globals.css'
import type { Metadata, Viewport } from 'next'

// アプリとしての表示設定（テーマカラーやズーム禁止など）
export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// PWA（インストール型アプリ）として認識させるためのメタデータ
export const metadata: Metadata = {
  title: '画像URL共有',
  description: '画像をURLで共有するアプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '画像URL共有',
  },
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
