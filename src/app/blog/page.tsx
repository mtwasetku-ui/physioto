import React from 'react'
import { getAllPosts } from '@/lib/blog'
import BlogList from './BlogList'
import type { Metadata } from 'next'
import { blogMetadata } from '@/app/metadata'

export const metadata: Metadata = blogMetadata

export default function BlogPage() {
  const posts = getAllPosts()
  const featuredPosts = posts.filter((p) => p.featured)
  const regularPosts = posts.filter((p) => !p.featured)
  const allPosts = [...featuredPosts, ...regularPosts]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Health & Wellness Blog</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Expert insights, recovery tips, and the latest news in physiotherapy from our dedicated team.
          </p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <BlogList posts={allPosts} />
      </main>
    </div>
  )
}
