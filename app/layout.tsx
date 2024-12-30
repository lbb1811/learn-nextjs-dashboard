import '@/app/ui/global.css';

import { inter } from '@/app/ui/fonts';
import clsx from 'clsx';
import { Metadata } from 'next';

export const metadata: Metadata = {
  // title: 'Next.js Dashboard',
  title: {
    template: '%s | Acme Dashboard',
    default: 'Acme Dashboard'
  },
  description: 'The official Next.js Course Dashboard, built with App Router.',
  metadataBase: new URL('https://nextjs-dashboard.vercel.sh'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={clsx(inter.className, 'antialiased')}>{children}</body>
    </html>
  );
}
