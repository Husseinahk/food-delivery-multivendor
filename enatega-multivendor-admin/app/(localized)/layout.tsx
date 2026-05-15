'use client';

// Core
import { ApolloProvider } from '@apollo/client';

// Prime React
import { PrimeReactProvider } from 'primereact/api';

// Providers
import { LayoutProvider } from '@/lib/context/global/layout.context';
import { SidebarProvider } from '@/lib/context/global/sidebar.context';
import { UserProvider } from '@/lib/context/global/user-context';

// Context
import { ConfigurationProvider } from '@/lib/context/global/configuration.context';
import { ToastProvider } from '@/lib/context/global/toast.context';

// Configuration
import { FontawesomeConfig } from '@/lib/config';

// Styles
import 'primereact/resources/primereact.css';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primeicons/primeicons.css';
import './global.css';

// Apollo
import { useSetupApollo } from '@/lib/hooks/useSetApollo';

import { useEffect, useState } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Apollo
  const client = useSetupApollo();

  // Upstream Enatega's provider/UI tree (metrics-token security feature +
  // shared UI chunks) is not SSR-safe — it touches localStorage/document
  // during render. The Orda deployment ships admin-web via `next start`, so
  // server-rendering the tree 500s every request. Enatega admin is a CSR SPA:
  // gate the whole subtree behind a client mount so none of it runs on the
  // server. One contained guard, upstream-merge-friendly. See orda issue #106.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Constants
  const value = {
    ripple: true,
  };

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <FontawesomeConfig />
      </head>
      <body className={'flex flex-col flex-wrap'} suppressHydrationWarning>
        {mounted && (
          <PrimeReactProvider value={value}>
            <ApolloProvider client={client}>
              <ConfigurationProvider>
                <LayoutProvider>
                  <UserProvider>
                    <SidebarProvider>
                      <ToastProvider>{children}</ToastProvider>
                    </SidebarProvider>
                  </UserProvider>
                </LayoutProvider>
              </ConfigurationProvider>
            </ApolloProvider>
          </PrimeReactProvider>
        )}
      </body>
    </html>
  );
}
