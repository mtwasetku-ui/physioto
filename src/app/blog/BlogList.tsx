'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

const POSTS_PER_PAGE = 9

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [visible, setVisible] = useState(false)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const paginatedPosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  )

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })

  const PostCard = ({ post, i }: { post: BlogPost; i: number }) => (
    <Link
      href={`/blog/${post.slug}`}
      className={`fade-up d${Math.min((i % 3) + 1, 5)} ${visible ? 'in' : ''} card-lift group flex flex-col overflow-hidden rounded-2xl border border-[#12241D]/10 bg-white shadow-sm`}
    >
      <div className="relative min-h-[200px] w-full overflow-hidden bg-[#F2EFE4]">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <span className="font-display flex h-full items-center justify-center text-6xl font-bold text-[#0E2C22]/15">P</span>
        )}
        <div className="absolute left-4 top-4 z-10">
          <span className="font-display rounded-full bg-[#FFC53D] px-3 py-1 text-xs font-extrabold text-[#0E2C22] shadow-sm">{post.category}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="mb-4 flex items-center gap-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(post.date)}</span>
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{post.author}</span>
          </div>
          <h3 className="font-display mb-3 text-xl font-bold leading-tight tracking-tight text-[#12241D] transition-colors group-hover:text-[#FF5638]">
            {post.title}
          </h3>
          <p className="mb-6 line-clamp-3 leading-relaxed text-slate-500">{post.excerpt}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FF5638] transition-all duration-300 group-hover:gap-3">
          Read More <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )

  return (
    <>
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-[#12241D]/10 bg-white py-20 text-center shadow-sm">
          <p className="text-lg text-slate-500">No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post, i) => (
              <PostCard key={post.slug} post={post} i={i} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-14 flex items-center justify-center gap-3">
              <button
                onClick={() => { setCurrentPage((p) => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-[#12241D]/15 bg-white px-4 py-2 font-medium text-slate-600 transition-all hover:border-[#FF5638]/50 hover:bg-[#FDE9E3] hover:text-[#FF5638] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`h-10 w-10 rounded-lg text-sm font-bold transition-all ${
                    page === currentPage
                      ? 'bg-[#FF5638] text-white shadow-md shadow-[#FF5638]/30'
                      : 'border border-[#12241D]/15 bg-white text-slate-600 hover:border-[#FF5638]/50 hover:bg-[#FDE9E3] hover:text-[#FF5638]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => { setCurrentPage((p) => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-[#12241D]/15 bg-white px-4 py-2 font-medium text-slate-600 transition-all hover:border-[#FF5638]/50 hover:bg-[#FDE9E3] hover:text-[#FF5638] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-slate-400">
            Page {currentPage} of {totalPages} — {posts.length} articles
          </p>
        </>
      )}
    </>
  )
}
