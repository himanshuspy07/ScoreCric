
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { I18nProvider } from '@/hooks/use-i18n';

export const metadata: Metadata = {
  title: 'ScoreCric Pro - Live Cricket Scoring',
  description: 'Professional real-time cricket match scoring and shared analytics',
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
        <FirebaseClientProvider>
          <I18nProvider>
            <div className="min-h-[100dvh] flex flex-col">
              <GlobalHeader />
              <main className="flex-1">
                {children}
              </main>
              <footer className="py-6 text-center text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                Made by Himanshu Yadav
              </footer>
            </div>
            <Toaster />
          </I18nProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
