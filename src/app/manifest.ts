import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'grofit — Train With Intent',
    short_name: 'grofit',
    description: 'Personalized fitness, science-based workout routines, 3D equipment lab, and nutrition tracking with grofit',
    start_url: '/app',
    id: '/app',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/images/grofit-crest.png?v=2',
        sizes: '415x415',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/grofit-crest.png?v=2',
        sizes: '415x415',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png?v=2',
        sizes: '415x415',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png?v=2',
        sizes: '415x415',
        type: 'image/png',
      },
    ],
  };
}

