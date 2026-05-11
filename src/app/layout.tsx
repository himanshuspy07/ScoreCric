
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="font-body antialiased bg-[#F3FAF4]">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
