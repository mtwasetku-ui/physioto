import { getAllPosts } from '@/lib/blog'
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://www.physiotohome.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/services`,
      lastModified: new Date('2026-03-09'),
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

  const blogPages: MetadataRoute.Sitemap = posts
    .filter((post) => post.date && !isNaN(new Date(post.date).getTime()))
    .map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  return [...staticPages, ...blogPages]
}
