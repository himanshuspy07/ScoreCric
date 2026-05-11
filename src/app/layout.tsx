
import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScoreCric PWA - Cricket Scoring',
  description: 'Professional cricket match scoring app for offline use',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ScoreCric',
  },
  themeColor: '#2C5A37',
};

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        {/* Simple Favicon Data URI for "SC" logo */}
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%232C5A37%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22Inter, sans-serif%22 font-weight=%22800%22 font-size=%2260%22 fill=%22white%22>SC</text></svg>" />
      </head>
      <body className="font-body antialiased bg-[#F3FAF4] text-foreground selection:bg-primary/20">
        <div className="min-h-[100dvh] flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
