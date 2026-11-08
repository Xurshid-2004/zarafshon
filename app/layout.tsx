import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zarafshon Residence — interaktiv 3D turar-joy majmuasi',
  description:
    'Interaktiv 3D turar-joy majmuasi: 7 va 11 qavatli binolar, qavat va xonadon tanlash, 360° aylanish. Three.js / React Three Fiber.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#070A0F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
