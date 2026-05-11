
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'ScoreCric PWA - Cricket Scoring',
  description: 'Professional cricket match scoring app for offline use',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ScoreCric',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#2C5A37',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#F3FAF4] text-foreground selection:bg-primary/20">
        <div className="min-h-[100dvh] flex flex-col">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
