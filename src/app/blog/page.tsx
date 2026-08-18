import React from 'react'
import { MapPin, BookOpen, ArrowDown } from 'lucide-react'
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

      {/* =====================================================
          HERO — SOLID GREEN
      ===================================================== */}
      <section className="relative overflow-hidden bg-[#0E2C22] py-24 text-white md:py-32">
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center lg:px-8">
          <div className="fade-up in mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2">
            <BookOpen className="h-4 w-4 text-[#FFC53D]" />

            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">
              Physio to Home Journal
            </span>
          </div>

          <h1 className="fade-up d1 in font-display mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            Physiotherapy{' '}
            <span className="italic text-[#FF5638]">
              insights & advice
            </span>
          </h1>

          <p className="fade-up d2 in mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Practical guidance on recovery, mobility, pain management
            and staying independent at home — written by our
            AHPRA-registered physiotherapy team.
          </p>

          <div className="fade-up d3 in mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#articles"
              className="sheen inline-flex items-center gap-2 rounded-xl bg-[#FF5638] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF5638]/25 transition-all hover:-translate-y-1 hover:bg-[#E8482B]"
            >
              Explore Our Articles
              <ArrowDown className="h-4 w-4" />
            </a>

            <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90">
              <MapPin className="h-4 w-4 text-[#FFC53D]" />
              Serving all of Tasmania
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BLOG CONTENT
      ===================================================== */}
      <section
        id="articles"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24"
      >
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF5638]">
            Knowledge Centre
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#12241D] md:text-4xl">
                Latest health &amp; physiotherapy advice
              </h2>

              <p className="mt-3 max-w-2xl text-slate-500">
                Evidence-informed information to help you understand
                your condition, improve movement and make confident
                decisions about your health.
              </p>
            </div>

            <div className="flex-shrink-0 rounded-xl bg-[#0E2C22] px-4 py-2.5 text-sm font-bold text-white">
              {posts.length} articles
            </div>
          </div>
        </div>

        <BlogList posts={posts} />
      </section>
    </div>
  )
}
