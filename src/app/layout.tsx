import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { TelegramProvider } from '@/components/providers/TelegramProvider';
import { ThemeRegistry } from '@/components/providers/ThemeRegistry';

export const metadata: Metadata = {
  title: 'Language Immersion',
  description: 'AI-powered language learning companion',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <TelegramProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </TelegramProvider>
      </body>
    </html>
  );
}
