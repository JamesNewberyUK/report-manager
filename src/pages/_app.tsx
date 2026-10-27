import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';
import Head from 'next/head';

function AppWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          router.push('/');
        } else if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <Head>
        <title>Report Manager</title>
        <meta name="description" content="Manage your reports and components" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthProvider>
        <AppWrapper>
          <Component {...pageProps} />
        </AppWrapper>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
