import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, User, ArrowLeft, ArrowRight, Tag } from 'lucide-react'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { internalLinks } from '@/lib/internalLinks'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ id: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = getPostBySlug(id)
  if (!post) return { title: 'Post Not Found' }

  const BASE_URL = 'https://www.physiotohome.com.au'
  const url = `${BASE_URL}/blog/${post.slug}`

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: post.image
        ? [{ url: post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`, width: 1200, height: 630, alt: post.title }]
        : [{ url: `${BASE_URL}/images/og-default.jpg`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

/**
 * Replaces the first occurrence of each configured keyword in a text string
 * with an internal blog link. Tracks used keywords via the `used` Set so
 * each keyword links only once across the entire post.
 */
function linkifyText(text: string, used: Set<string>): React.ReactNode {
  // Sort keywords longest-first so specific phrases match before substrings
  const keywords = Object.keys(internalLinks).sort((a, b) => b.length - a.length)

  const segments: React.ReactNode[] = []
  let remaining = text

  while (remaining.length > 0) {
    let earliest: { index: number; keyword: string } | null = null

    for (const kw of keywords) {
      if (used.has(kw)) continue
      const idx = remaining.toLowerCase().indexOf(kw.toLowerCase())
      if (idx === -1) continue
      if (!earliest || idx < earliest.index) {
        earliest = { index: idx, keyword: kw }
      }
    }

    if (!earliest) {
      segments.push(remaining)
      break
    }

    const { index, keyword } = earliest
    if (index > 0) segments.push(remaining.slice(0, index))

    const matched = remaining.slice(index, index + keyword.length)
    const href = internalLinks[keyword].startsWith('/')
      ? internalLinks[keyword]
      : `/blog/${internalLinks[keyword]}`

    segments.push(
      <Link
        key={`${keyword}-${index}`}
        href={href}
        className="text-blue-600 hover:text-blue-700 underline underline-offset-2 decoration-blue-300 hover:decoration-blue-500 transition-colors"
      >
        {matched}
      </Link>
    )

    used.add(keyword)
    remaining = remaining.slice(index + keyword.length)
  }

  return segments.length === 1 ? segments[0] : <>{segments}</>
}

/**
 * Splits a line by **bold** markers, then applies linkifyText to plain segments.
 */
function renderInline(text: string, used: Set<string>): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i}>{part}</strong>
          : <React.Fragment key={i}>{linkifyText(part, used)}</React.Fragment>
      )}
    </>
  )
}

function renderMarkdown(content: string, currentSlug: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  // Track used keywords per post — shared across the whole render
  const used = new Set<string>()
  // Never link to the current post
  Object.entries(internalLinks).forEach(([kw, slug]) => {
    if (slug === currentSlug || slug === `/blog/${currentSlug}`) used.add(kw)
  })

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-2xl font-bold text-gray-900 mt-10 mb-4">{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-3">{line.slice(4)}</h3>)
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      elements.push(<p key={i} className="font-semibold text-gray-900 mb-2">{line.slice(2, -2)}</p>)
    } else if (line.startsWith('- ')) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`list-${i}`} className="list-disc list-inside space-y-2 text-gray-700 mb-6 ml-4">
          {listItems.map((item, j) => (
            <li key={j}>{renderInline(item, used)}</li>
          ))}
        </ul>
      )
      continue
    } else if (line.trim() === '') {
      // skip blank lines
    } else {
      elements.push(
        <p key={i} className="text-gray-700 leading-relaxed mb-5">
          {renderInline(line, used)}
        </p>
      )
    }
    i++
  }

  return elements
}

export default async function BlogPostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = getPostBySlug(id)
  if (!post) notFound()

  // Resolve related posts from slugs in frontmatter (max 2)
  const relatedPosts = post.related_posts
    .slice(0, 2)
    .map((slug) => getPostBySlug(slug))
    .filter(Boolean) as import('@/lib/blog').BlogPost[]

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Hero */}
      <div className="w-full h-[40vh] md:h-[50vh] relative bg-gradient-to-r from-blue-800 to-blue-600">
        {post.image && (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover opacity-30"
            priority
          />
        )}
        <div className="absolute inset-0 flex items-end pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <Link href="/blog" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to all posts
            </Link>
            <div className="mb-4">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{post.category}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center text-white/90 text-sm gap-6">
              <span className="flex items-center"><User className="w-4 h-4 mr-2" />{post.author}</span>
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-2" />{formatDate(post.date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          {renderMarkdown(post.content, post.slug)}
        </div>
        <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center text-gray-500"><Tag className="w-5 h-5 mr-2" /><span className="font-medium">{post.category}</span></div>
          <Link href="/blog" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Link>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-100 py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
                >
                  <div className="relative w-full h-40 bg-blue-50 flex items-center justify-center overflow-hidden">
                    {related.image ? (
                      <Image
                        src={related.image}
                        alt={related.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <span className="text-blue-200 font-bold text-5xl">P</span>
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-white/90 backdrop-blur-sm text-blue-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">{related.category}</span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs text-gray-400 mb-2 flex items-center"><Calendar className="w-3 h-3 mr-1" />{formatDate(related.date)}</p>
                    <h3 className="font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">{related.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{related.excerpt}</p>
                    <span className="inline-flex items-center text-blue-600 text-sm font-semibold group-hover:text-blue-700">
                      Read Article <ArrowRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
