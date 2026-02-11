import './globals.css';
import { Header } from '@/components/layout/header';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AdminProvider } from '@/context/admin-context';
import { InteractiveEffects } from '@/components/layout/interactive-effects';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700&display=swap" rel="stylesheet" />
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
