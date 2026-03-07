'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, User, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

const POSTS_PER_PAGE = 9

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE)

  const paginatedPosts = posts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  )

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })

  const PostCard = ({ post }: { post: BlogPost }) => (
    <Link href={`/blog/${post.slug}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col">
      <div className="relative w-full min-h-[200px] bg-blue-50 flex items-center justify-center overflow-hidden">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <span className="text-blue-200 font-bold text-6xl">P</span>
        )}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">{post.category}</span>
        </div>
      </div>
      <div className="p-6 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{formatDate(post.date)}</span>
            <span className="flex items-center"><User className="w-4 h-4 mr-1" />{post.author}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">{post.excerpt}</p>
        </div>
        <span className="inline-flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
          Read More <ArrowRight className="w-4 h-4 ml-2" />
        </span>
      </div>
    </Link>
  )

  return (
    <>
      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-lg">No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedPosts.map((post) => (
              <PostCard
                key={post.slug}
                post={post}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-14">
              <button
                onClick={() => { setCurrentPage((p) => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                    page === currentPage
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => { setCurrentPage((p) => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-400 mt-4">
            Page {currentPage} of {totalPages} — {posts.length} articles
          </p>
        </>
      )}
    </>
  )
}
