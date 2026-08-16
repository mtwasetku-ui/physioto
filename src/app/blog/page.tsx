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
    <div className="font-body min-h-screen overflow-x-hidden bg-[#FBF8F1] text-[#12241D]">
      <div className="pth-grain" aria-hidden="true" />

      {/* HERO */}
      <section className="dots relative overflow-hidden bg-[#0E2C22] py-24 text-white">
        <div className="pointer-events-none absolute inset-0 text-white/5" />
        <div className="absolute -top-20 right-[-40px] h-96 w-96 rounded-full bg-[#FF5638]/15 blur-3xl" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-8">
          <div className="fade-up in mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <MapPin className="h-4 w-4 text-[#FFC53D]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">Serving all of Tasmania</span>
          </div>
          <h1 className="fade-up d1 in font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Physiotherapy <span className="italic text-[#FFC53D]">insights &amp; advice</span>
          </h1>
          <p className="fade-up d2 in mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            Practical guidance on recovery, mobility, and staying independent at home — written by our AHPRA-registered physiotherapy team.
          </p>
        </div>
      </section>

      {/* Posts */}
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <BlogList posts={posts} />
      </div>
    </div>
  )
}
