'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

const POSTS_PER_PAGE = 9

export default function BlogList({
  posts,
}: {
  posts: BlogPost[]
}) {
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
    new Date(d).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const PostCard = ({
    post,
    i,
  }: {
    post: BlogPost
    i: number
  }) => (
    <Link
      href={`/blog/${post.slug}`}
      className={`fade-up d${Math.min(
        (i % 3) + 1,
        5
      )} ${visible ? 'in' : ''} card-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-[#12241D]/10 bg-white shadow-[0_10px_30px_-20px_rgba(10,35,27,0.35)]`}
    >
      {/* IMAGE */}
      <div className="relative h-[235px] w-full overflow-hidden bg-[#F2EFE4]">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-7xl font-extrabold text-[#0E2C22]/10">
              P
            </span>
          </div>
        )}

        {/* IMAGE OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E2C22]/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* CATEGORY */}
        <div className="absolute left-5 top-5 z-10">
          <span className="font-display rounded-full bg-[#FFC53D] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#0E2C22] shadow-md">
            {post.category}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col justify-between p-6 md:p-7">
        <div>
          {/* META */}
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#FF5638]" />
              {formatDate(post.date)}
            </span>

            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#FF5638]" />
              {post.author}
            </span>

            {post.readingTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#FF5638]" />
                {post.readingTime} min
              </span>
            )}
          </div>

          {/* TITLE */}
          <h3 className="font-display mb-3 text-xl font-extrabold leading-tight tracking-tight text-[#12241D] transition-colors duration-300 group-hover:text-[#FF5638]">
            {post.title}
          </h3>

          {/* EXCERPT */}
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">
            {post.excerpt}
          </p>
        </div>

        {/* READ MORE */}
        <div className="mt-7 flex items-center justify-between border-t border-[#12241D]/10 pt-5">
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FF5638] transition-all duration-300 group-hover:gap-3">
            Read Article
            <ArrowRight className="h-4 w-4" />
          </span>

          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2EFE4] transition-all duration-300 group-hover:bg-[#0E2C22] group-hover:text-white">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )

  return (
    <>
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-[#12241D]/10 bg-white py-20 text-center shadow-sm">
          <p className="text-lg text-slate-500">
            No blog posts yet. Check back soon!
          </p>
        </div>
      ) : (
        <>
          {/* POSTS */}
          <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post, i) => (
              <PostCard
                key={post.slug}
                post={post}
                i={i}
              />
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="mt-16">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setCurrentPage((p) =>
                      Math.max(p - 1, 1)
                    )

                    window.scrollTo({
                      top: 0,
                      behavior: 'smooth',
                    })
                  }}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 rounded-xl border border-[#12241D]/15 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-[#FF5638]/50 hover:bg-[#FDE9E3] hover:text-[#FF5638] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page)

                      window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      })
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                      page === currentPage
                        ? 'bg-[#0E2C22] text-[#FFC53D] shadow-md shadow-[#0E2C22]/20'
                        : 'border border-[#12241D]/15 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-[#FF5638]/50 hover:bg-[#FDE9E3] hover:text-[#FF5638]'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setCurrentPage((p) =>
                      Math.min(p + 1, totalPages)
                    )

                    window.scrollTo({
                      top: 0,
                      behavior: 'smooth',
                    })
                  }}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 rounded-xl border border-[#12241D]/15 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-[#FF5638]/50 hover:bg-[#FDE9E3] hover:text-[#FF5638] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-5 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                Page {currentPage} of {totalPages}
                {' · '}
                {posts.length} articles
              </p>
            </div>
          )}
        </>
      )}
    </>
  )
}
