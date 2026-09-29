import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EUODIA by Papa joe\'s Food',
    short_name: 'EUODIA',
    description: 'Aplikasi Kasir EUODIA by Papa joe\'s Food',
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
