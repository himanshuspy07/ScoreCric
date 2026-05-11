
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ScoreCric Professional',
    short_name: 'ScoreCric',
    description: 'Professional cricket match scoring and analytics',
    start_url: '/',
    display: 'standalone',
    background_color: '#F3FAF4',
    theme_color: '#2C5A37',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
