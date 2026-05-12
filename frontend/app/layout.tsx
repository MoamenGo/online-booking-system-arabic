import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

// ===== الخط العربي =====
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-arabic',
});

// ===== بيانات الصفحة (SEO) =====
export const metadata: Metadata = {
  title: 'نظام الحجز الذكي',
  description: 'نظام حجز مواعيد أونلاين للعيادات والصالونات والمدارس والمطاعم في السوق العربي',
  keywords: 'حجز مواعيد, نظام حجز, عيادات, صالونات, مواعيد أونلاين',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexArabic.variable}>
      <body className="bg-background text-on-background font-arabic antialiased min-h-screen">
        {/* إشعارات Toast */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              direction: 'rtl',
              background: '#ffffff',
              color: '#131b2e',
              border: '1px solid #c2c6d6',
              borderRadius: '0.75rem',
              padding: '12px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ba1a1a', secondary: '#fff' },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
