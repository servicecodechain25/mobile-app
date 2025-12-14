export const metadata = {
  title: 'Admin App',
  description: 'Admin management system with role-based access control',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

import AppShell from './components/AppShell';
import Providers from './providers';
import './globals.css';
import { ToastProvider } from './components/ToastProvider';
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', margin: 0, padding: 12 }}>
        <Providers>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}

