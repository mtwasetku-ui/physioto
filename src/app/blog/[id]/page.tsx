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

  const BASE_URL = 'https://www.physiotohome.com'
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
        style={{ color: '#0891b2', textDecoration: 'underline', textDecorationColor: '#bae6fd', textUnderlineOffset: 3 }}
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
 * Splits a line by **bold** markers and [text](url) markdown links,
 * then applies linkifyText to plain segments.
 */
function renderInline(text: string, used: Set<string>): React.ReactNode {
  // Tokenise: split on [text](url) first, then handle **bold** within plain segments
  const tokens = text.split(/(\[[^\]]+\]\([^)]+\))/)
  const nodes: React.ReactNode[] = []
  let k = 0

  tokens.forEach((token, ti) => {
    if (ti % 2 === 1) {
      // Markdown link token [label](href)
      const m = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (m) {
        nodes.push(
          <Link
            key={`mdlink-${k++}`}
            href={m[2]}
            style={{ color: '#0891b2', textDecoration: 'underline', textDecorationColor: '#bae6fd', textUnderlineOffset: 3 }}
          >
            {m[1]}
          </Link>
        )
      }
    } else {
      // Plain text — handle **bold** then linkify
      const boldParts = token.split(/\*\*(.*?)\*\*/)
      boldParts.forEach((bp, j) => {
        if (j % 2 === 1) {
          nodes.push(<strong key={`b-${k++}`} style={{ color: '#0f172a', fontWeight: 700 }}>{bp}</strong>)
        } else if (bp) {
          nodes.push(<React.Fragment key={`t-${k++}`}>{linkifyText(bp, used)}</React.Fragment>)
        }
      })
    }
  })

  return <>{nodes}</>
}

function renderMarkdown(content: string, currentSlug: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  const used = new Set<string>()
  Object.entries(internalLinks).forEach(([kw, slug]) => {
    if (slug === currentSlug || slug === `/blog/${currentSlug}`) used.add(kw)
  })

  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // H1 — skip, shown in hero
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      i++
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(19px, 2.8vw, 24px)',
          fontWeight: 700,
          color: '#0f172a',
          marginTop: 52,
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: '2px solid #e0f2fe',
          lineHeight: 1.3,
        }}>
          {renderInline(line.slice(3), used)}
        </h2>
      )
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 'clamp(16px, 2.2vw, 19px)',
          fontWeight: 600,
          color: '#0891b2',
          marginTop: 32,
          marginBottom: 8,
          lineHeight: 1.35,
        }}>
          {renderInline(line.slice(4), used)}
        </h3>
      )
      i++
      continue
    }

    // Horizontal rule — decorative divider
    if (line.trim() === '---') {
      elements.push(
        <div key={i} style={{ margin: '44px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #bae6fd)' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0891b2', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #bae6fd, transparent)' }} />
        </div>
      )
      i++
      continue
    }

    // Standalone bold line (subheading)
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4 && !line.slice(2, -2).includes('**')) {
      elements.push(
        <p key={i} style={{
          fontWeight: 700,
          color: '#0f172a',
          fontSize: 15.5,
          marginBottom: 4,
          marginTop: 22,
          letterSpacing: '0.01em',
        }}>
          {renderInline(line.slice(2, -2), used)}
        </p>
      )
      i++
      continue
    }

    // Bullet list
    if (line.startsWith('- ')) {
      const listItems: string[] = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        listItems.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`list-${i}`} style={{ margin: '4px 0 28px', padding: 0, listStyle: 'none' }}>
          {listItems.map((item, j) => (
            <li key={j} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '9px 12px',
              background: j % 2 === 0 ? '#f8fafc' : '#fff',
              borderRadius: 8,
              fontSize: 16,
              color: '#334155',
              lineHeight: 1.65,
            }}>
              <span style={{
                marginTop: 8,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#0891b2',
                flexShrink: 0,
              }} />
              <span>{renderInline(item, used)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Blank line
    if (line.trim() === '') {
      i++
      continue
    }

    // Meta lines (author, date)
    const isMetaLine = /^(Michael|Micheal)\s+Ghattas/.test(line) || /^\d+\/\d+\/\d+\s*·/.test(line)
    if (isMetaLine) {
      elements.push(
        <p key={i} style={{ color: '#94a3b8', fontSize: 13, marginBottom: 2, fontStyle: 'italic' }}>
          {renderInline(line, used)}
        </p>
      )
      i++
      continue
    }

    // Body paragraph
    elements.push(
      <p key={i} style={{
        color: '#374151',
        fontSize: 16.5,
        lineHeight: 1.9,
        marginBottom: 22,
        fontFamily: 'Georgia, serif',
      }}>
        {renderInline(line, used)}
      </p>
    )
    i++
  }

  return elements
}

export default async function BlogPostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = getPostBySlug(id)
  if (!post) notFound()

  const relatedPosts = post.related_posts
    .slice(0, 2)
    .map((slug) => getPostBySlug(slug))
    .filter(Boolean) as import('@/lib/blog').BlogPost[]

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ width: '100%', height: 'clamp(320px, 50vh, 520px)', position: 'relative', background: '#0f172a' }}>
        {post.image && (
          <Image
            src={post.image}
            alt={post.title}
            fill
            style={{ objectFit: 'cover', opacity: 0.35 }}
            priority
          />
        )}
        {/* gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.4) 60%, transparent 100%)' }} />

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', paddingBottom: 48 }}>
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px', width: '100%' }}>
            <Link href="/blog" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none', marginBottom: 20,
            }}>
              <ArrowLeft size={14} /> Back to all posts
            </Link>

            <div style={{ marginBottom: 14 }}>
              <span style={{
                background: '#0891b2', color: '#fff',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '4px 12px', borderRadius: 999,
              }}>
                {post.category}
              </span>
            </div>

            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(24px, 4.5vw, 44px)',
              color: '#fff',
              margin: '0 0 20px',
              lineHeight: 1.2,
              fontWeight: 700,
              maxWidth: 760,
            }}>
              {post.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                <User size={14} />{post.author}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                <Calendar size={14} />{formatDate(post.date)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Article content */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '56px 24px 0' }}>

        {/* Excerpt / lead */}
        {post.excerpt && (
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
            borderLeft: '4px solid #0891b2',
            borderRadius: '0 12px 12px 0',
            padding: '18px 22px',
            marginBottom: 44,
          }}>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 17,
              color: '#0c4a6e',
              lineHeight: 1.7,
              margin: 0,
              fontStyle: 'italic',
            }}>
              {post.excerpt}
            </p>
          </div>
        )}

        {/* Body */}
        <div>
          {renderMarkdown(post.content, post.slug)}
        </div>

        {/* Footer bar */}
        <div style={{
          marginTop: 60,
          paddingTop: 24,
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
            <Tag size={15} />
            <span style={{ fontWeight: 600 }}>{post.category}</span>
          </div>
          <Link href="/blog" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            color: '#374151',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            background: '#f8fafc',
          }}>
            <ArrowLeft size={13} /> Back to Blog
          </Link>
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '64px 24px', marginTop: 64 }}>
          <div style={{ maxWidth: 740, margin: '0 auto' }}>
            <div style={{ width: 40, height: 3, background: 'linear-gradient(90deg,#0891b2,#06b6d4)', borderRadius: 2, marginBottom: 16 }} />
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 26, fontWeight: 700, color: '#0f172a', margin: '0 0 32px',
            }}>
              Related Articles
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  style={{
                    background: '#fff', borderRadius: 16,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                    textDecoration: 'none',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
                >
                  <div style={{ position: 'relative', width: '100%', height: 160, background: '#e0f2fe', overflow: 'hidden' }}>
                    {related.image ? (
                      <Image
                        src={related.image}
                        alt={related.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700, color: '#bae6fd' }}>P</span>
                    )}
                    <div style={{ position: 'absolute', top: 10, left: 10 }}>
                      <span style={{ background: 'rgba(255,255,255,0.92)', color: '#0891b2', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                        {related.category}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} />{formatDate(related.date)}
                    </p>
                    <h3 style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontWeight: 700, color: '#0f172a', fontSize: 15,
                      marginBottom: 8, lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {related.title}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, flex: 1, marginBottom: 14,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {related.excerpt}
                    </p>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#0891b2', fontSize: 13, fontWeight: 600 }}>
                      Read Article <ArrowRight size={12} />
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
