import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://agrilink.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/fco/',
          '/admin/',
          '/admin-login/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
