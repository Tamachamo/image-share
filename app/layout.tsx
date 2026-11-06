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
  title: '作戦マップ共有',
  description: '作戦マップを共有するアプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'マップ共有',
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
