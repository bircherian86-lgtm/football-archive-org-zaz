import './globals.css';
import { Header } from '@/components/layout/header';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AdminProvider } from '@/context/admin-context';
import { InteractiveEffects } from '@/components/layout/interactive-effects';
import { Exo_2 } from 'next/font/google';

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-exo2',
  display: 'swap',
});

export const metadata = {
  title: 'Football Clips Archive',
  description: 'Upload, discover, and download football clips.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={exo2.variable}>
      <head>
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="midnight"
          enableSystem={false}
          themes={['light', 'dark', 'midnight', 'sepia', 'nord']}
        >
          <Providers>
            <AdminProvider>
              <InteractiveEffects />
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </AdminProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
