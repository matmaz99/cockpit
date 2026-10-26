import type { Metadata } from 'next';
import './globals.css';
import './cockpit.css';

export const metadata: Metadata = {
  title: { default: 'Cockpit', template: '%s · Cockpit' },
  robots: { index: false, follow: false },
};

// Light by default like Parksun; the saved choice is applied before paint to avoid a flash.
const THEME = "try{var t=localStorage.getItem('sp-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
