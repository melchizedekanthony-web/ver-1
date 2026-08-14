import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata = {
  title: 'WannaGo - Connect & Share Activities',
  description: 'Connect with people for activities, share locations, and meet up in real-time',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${outfit.className} bg-background text-foreground antialiased selection:bg-primary/30 min-h-screen flex flex-col`}>
        <Providers>
          {children}
          <Toaster position="top-center" richColors theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
