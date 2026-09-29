import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Papa Joe POS',
    short_name: 'POS',
    description: 'Aplikasi Kasir Papa Joe POS',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f4f6',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon', // Referensi ke app/icon.tsx
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
