import { getAllPosts } from '@/lib/blog'
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.physiotohome.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date('2026-07-05'),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: new Date('2026-07-05'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/booking`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/team`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // Location slugs get highest blog priority (0.8) — highest search volume in TAS
  const locationSlugs = [
    'home-physiotherapy-launceston',
    'home-physiotherapy-deloraine',
    'home-physiotherapy-george-town',
    'home-physiotherapy-longford',
    'home-physiotherapy-scottsdale',
    'home-physiotherapy-tamar-valley-exeter-beaconsfield',
    'home-physiotherapy-hobart',
    'home-physiotherapy-devonport-burnie',
  ]

  // High-intent evergreen guides get 0.7
  const guideSlugs = [
    'benefits-of-home-physiotherapy',
    'falls-prevention-home-physiotherapy',
    'ndis-home-physiotherapy-funding',
    'my-aged-care-home-physiotherapy-funding',
    'medicare-gp-management-plan-physiotherapy-funding',
    'home-physiotherapy-vs-clinic-physiotherapy-comparison',
    'dva-physiotherapy-tasmania',
  ]

  function getBlogPriority(slug: string): number {
    if (locationSlugs.includes(slug)) return 0.8
    if (guideSlugs.includes(slug)) return 0.7
    return 0.6
  }

  const blogPages: MetadataRoute.Sitemap = posts
    .filter((post) => post.date && !isNaN(new Date(post.date).getTime()))
    .map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: getBlogPriority(post.slug),
    }))

  return [...staticPages, ...blogPages]
}
