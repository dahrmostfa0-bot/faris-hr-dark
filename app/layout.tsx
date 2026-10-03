<<<<<<< HEAD
 import './globals.css';
=======
import './globals.css';
>>>>>>> 625a8a03d1b9e1649a51a522adaf5ddf0b2629c9
import type { Metadata } from 'next';
import { Cairo, Tajawal } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/lib/auth-context';
import { GuideProvider } from '@/lib/guide-context';
import { Toaster } from '@/components/ui/toaster';
<<<<<<< HEAD
import { Providers } from "./providers";
=======
>>>>>>> 625a8a03d1b9e1649a51a522adaf5ddf0b2629c9

const cairo = Cairo({ subsets: ['arabic', 'latin'], display: 'swap', variable: '--font-cairo' });
const tajawal = Tajawal({ subsets: ['arabic', 'latin'], display: 'swap', variable: '--font-tajawal', weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'نظام فارس دحروج لإدارة الموارد البشرية - Faris HR',
  description: 'نظام متكامل لإدارة شؤون الموظفين - الحضور، الإجازات، الرواتب، العقود، التقييم',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="font-tajawal antialiased" suppressHydrationWarning>
        <ThemeProvider>
<<<<<<< HEAD
          <Providers>
            <AuthProvider>
              <GuideProvider>
                {children}
                <Toaster />
              </GuideProvider>
            </AuthProvider>
          </Providers>
=======
          <AuthProvider>
            <GuideProvider>
              {children}
              <Toaster />
            </GuideProvider>
          </AuthProvider>
>>>>>>> 625a8a03d1b9e1649a51a522adaf5ddf0b2629c9
        </ThemeProvider>
      </body>
    </html>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 625a8a03d1b9e1649a51a522adaf5ddf0b2629c9
