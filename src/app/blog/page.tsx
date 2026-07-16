import React from 'react'
import { MapPin } from 'lucide-react'
import { getAllPosts } from '@/lib/blog'
import { blogMetadata } from '@/app/metadata'
import BlogList from './BlogList'
import type { Metadata } from 'next'

export const metadata: Metadata = blogMetadata

export default function BlogPage() {
  const posts = getAllPosts().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-2 mb-6">
            <MapPin className="w-4 h-4 text-emerald-200" />
            <span className="text-white text-sm font-medium">Serving all of Tasmania</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Physiotherapy Insights &amp; Advice</h1>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
            Practical guidance on recovery, mobility, and staying independent at home — written by our AHPRA-registered physiotherapy team.
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <BlogList posts={posts} />
      </div>
    </div>
  )
}
