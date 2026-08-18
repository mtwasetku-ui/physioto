import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import {
  Calendar,
  User,
  ArrowLeft,
  Tag,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { internalLinks } from '@/lib/internalLinks'
import RelatedPostCard from './RelatedPostCard'
import type { Metadata } from 'next'

const MAX_AUTO_LINKS = 5

const BRAND = {
  forest: '#0A231B',
  dark: '#0E2C22',
  green: '#4E9B72',
  sage: '#7FB69B',
  paleGreen: '#E7F2E7',
  cream: '#F2EFE4',
  background: '#FBF8F1',
  orange: '#FF5638',
  orangeDark: '#E8482B',
  yellow: '#FFC53D',
  text: '#17251F',
  muted: '#64736B',
  border: '#DCE6DF',
}

export async function generateStaticParams() {
  const posts = getAllPosts()

  return posts.map((post) => ({
    id: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const post = getPostBySlug(id)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  const BASE_URL = 'https://www.physiotohome.com'
  const url = `${BASE_URL}/blog/${post.slug}`

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: post.image
        ? [
            {
              url: post.image.startsWith('http')
                ? post.image
                : `${BASE_URL}${post.image}`,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : [
            {
              url: `${BASE_URL}/images/og-default.jpg`,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

/**
 * Automatically links configured internal keywords.
 * Maximum of 5 generated links per article.
 */
function linkifyText(
  text: string,
  used: Set<string>,
  budget: { count: number }
): React.ReactNode {
  const keywords = Object.keys(internalLinks).sort(
    (a, b) => b.length - a.length
  )

  const segments: React.ReactNode[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (budget.count >= MAX_AUTO_LINKS) {
      segments.push(remaining)
      break
    }

    let earliest: {
      index: number
      keyword: string
    } | null = null

    for (const kw of keywords) {
      if (used.has(kw)) continue

      const idx = remaining
        .toLowerCase()
        .indexOf(kw.toLowerCase())

      if (idx === -1) continue

      if (!earliest || idx < earliest.index) {
        earliest = {
          index: idx,
          keyword: kw,
        }
      }
    }

    if (!earliest) {
      segments.push(remaining)
      break
    }

    const { index, keyword } = earliest

    if (index > 0) {
      segments.push(remaining.slice(0, index))
    }

    const matched = remaining.slice(
      index,
      index + keyword.length
    )

    const href = internalLinks[keyword].startsWith('/')
      ? internalLinks[keyword]
      : `/blog/${internalLinks[keyword]}`

    segments.push(
      <Link
        key={`${keyword}-${index}`}
        href={href}
        style={{
          color: BRAND.green,
          textDecoration: 'underline',
          textDecorationColor: BRAND.sage,
          textUnderlineOffset: 3,
          fontWeight: 500,
        }}
      >
        {matched}
      </Link>
    )

    used.add(keyword)
    budget.count++

    remaining = remaining.slice(index + keyword.length)
  }

  return segments.length === 1 ? segments[0] : <>{segments}</>
}

/**
 * Renders markdown-style inline content.
 */
function renderInline(
  text: string,
  used: Set<string>,
  budget: { count: number },
  autoLink: boolean = true
): React.ReactNode {
  const tokens = text.split(/(\[[^\]]+\]\([^)]+\))/)

  const nodes: React.ReactNode[] = []
  let k = 0

  tokens.forEach((token, ti) => {
    if (ti % 2 === 1) {
      const m = token.match(
        /^\[([^\]]+)\]\(([^)]+)\)$/
      )

      if (m) {
        nodes.push(
          <Link
            key={`mdlink-${k++}`}
            href={m[2]}
            style={{
              color: BRAND.green,
              textDecoration: 'underline',
              textDecorationColor: BRAND.sage,
              textUnderlineOffset: 3,
              fontWeight: 500,
            }}
          >
            {m[1]}
          </Link>
        )
      }
    } else {
      const boldParts = token.split(/\*\*(.*?)\*\*/)

      boldParts.forEach((bp, j) => {
        if (j % 2 === 1) {
          nodes.push(
            <strong
              key={`b-${k++}`}
              style={{
                color: BRAND.forest,
                fontWeight: 700,
              }}
            >
              {bp}
            </strong>
          )
        } else if (bp) {
          nodes.push(
            <React.Fragment key={`t-${k++}`}>
              {autoLink
                ? linkifyText(bp, used, budget)
                : bp}
            </React.Fragment>
          )
        }
      })
    }
  })

  return <>{nodes}</>
}

/**
 * Converts the blog markdown content into styled React elements.
 */
function renderMarkdown(
  content: string,
  currentSlug: string
) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  const used = new Set<string>()
  const budget = {
    count: 0,
  }

  Object.entries(internalLinks).forEach(
    ([kw, slug]) => {
      if (
        slug === currentSlug ||
        slug === `/blog/${currentSlug}`
      ) {
        used.add(kw)
      }
    }
  )

  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    /* H1 is already displayed in the hero */
    if (
      line.startsWith('# ') &&
      !line.startsWith('## ')
    ) {
      i++
      continue
    }

    /* H2 */
    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={i}
          style={{
            fontFamily:
              'var(--font-bricolage), sans-serif',
            fontSize: 'clamp(21px, 3vw, 30px)',
            fontWeight: 700,
            color: BRAND.forest,
            marginTop: 56,
            marginBottom: 18,
            paddingBottom: 14,
            borderBottom: `2px solid ${BRAND.paleGreen}`,
            lineHeight: 1.25,
          }}
        >
          {renderInline(
            line.slice(3),
            used,
            budget,
            false
          )}
        </h2>
      )

      i++
      continue
    }

    /* H3 */
    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={i}
          style={{
            fontFamily:
              'var(--font-bricolage), sans-serif',
            fontSize: 'clamp(18px, 2.5vw, 22px)',
            fontWeight: 650,
            color: BRAND.green,
            marginTop: 36,
            marginBottom: 12,
            lineHeight: 1.35,
          }}
        >
          {renderInline(
            line.slice(4),
            used,
            budget,
            false
          )}
        </h3>
      )

      i++
      continue
    }

    /* Horizontal rule */
    if (line.trim() === '---') {
      elements.push(
        <div
          key={i}
          style={{
            margin: '48px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${BRAND.sage})`,
            }}
          />

          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: BRAND.orange,
              flexShrink: 0,
            }}
          />

          <div
            style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(90deg, ${BRAND.sage}, transparent)`,
            }}
          />
        </div>
      )

      i++
      continue
    }

    /* Standalone bold line */
    if (
      line.startsWith('**') &&
      line.endsWith('**') &&
      line.length > 4 &&
      !line.slice(2, -2).includes('**')
    ) {
      elements.push(
        <p
          key={i}
          style={{
            fontWeight: 700,
            color: BRAND.forest,
            fontSize: 16,
            marginBottom: 6,
            marginTop: 24,
            letterSpacing: '0.01em',
            paddingLeft: 14,
            borderLeft: `3px solid ${BRAND.sage}`,
          }}
        >
          {renderInline(
            line.slice(2, -2),
            used,
            budget
          )}
        </p>
      )

      i++
      continue
    }

    /* Bullet list */
    if (line.startsWith('- ')) {
      const listItems: string[] = []

      while (
        i < lines.length &&
        lines[i].startsWith('- ')
      ) {
        listItems.push(lines[i].slice(2))
        i++
      }

      elements.push(
        <ul
          key={`list-${i}`}
          style={{
            margin: '8px 0 30px',
            padding: 0,
            listStyle: 'none',
          }}
        >
          {listItems.map((item, j) => (
            <li
              key={j}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 14px',
                background:
                  j % 2 === 0
                    ? BRAND.paleGreen
                    : '#FFFFFF',
                borderRadius: 10,
                fontSize: 16,
                color: BRAND.text,
                lineHeight: 1.65,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  marginTop: 9,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: BRAND.green,
                  flexShrink: 0,
                }}
              />

              <span>
                {renderInline(
                  item,
                  used,
                  budget
                )}
              </span>
            </li>
          ))}
        </ul>
      )

      continue
    }

    /* Blank line */
    if (line.trim() === '') {
      i++
      continue
    }

    /* Body paragraph */
    elements.push(
      <p
        key={i}
        style={{
          color: BRAND.text,
          fontSize: 17,
          lineHeight: 1.9,
          marginBottom: 23,
          fontFamily:
            'var(--font-instrument-sans), system-ui, sans-serif',
        }}
      >
        {renderInline(line, used, budget)}
      </p>
    )

    i++
  }

  return elements
}

export default async function BlogPostDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = getPostBySlug(id)

  if (!post) {
    notFound()
  }

  const relatedPosts = post.related_posts
    .slice(0, 2)
    .map((slug) => getPostBySlug(slug))
    .filter(Boolean) as import('@/lib/blog').BlogPost[]

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  /* ============================================================
     STRUCTURED DATA
     ============================================================ */

  const BASE_URL = 'https://www.physiotohome.com'

  const postUrl = `${BASE_URL}/blog/${post.slug}`

  const imageUrl = post.image
    ? post.image.startsWith('http')
      ? post.image
      : `${BASE_URL}${post.image}`
    : `${BASE_URL}/images/og-default.jpg`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: 'Micheal Ghattas',
      jobTitle: 'Physiotherapist',
      identifier: 'AHPRA PHY0002634794',
      url: `${BASE_URL}/team`,
      worksFor: {
        '@type': 'MedicalBusiness',
        name: 'Physio to Home',
        url: BASE_URL,
      },
    },
    publisher: {
      '@type': 'MedicalBusiness',
      name: 'Physio to Home',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    url: postUrl,
  }

  /* FAQ schema */

  let faqSchema: Record<string, unknown> | null = null

  const faqHeading =
    /^## (?:Frequently Asked Questions|FAQ|Common Questions)/

  const lines = post.content.split('\n')

  const faqStart = lines.findIndex((l) =>
    faqHeading.test(l)
  )

  if (faqStart !== -1) {
    const faqLines = lines.slice(faqStart + 1)

    const entities: {
      '@type': string
      name: string
      acceptedAnswer: {
        '@type': string
        text: string
      }
    }[] = []

    let currentQ = ''
    let currentA: string[] = []

    for (const line of faqLines) {
      if (line.startsWith('## ')) {
        break
      }

      if (line.startsWith('### ')) {
        if (
          currentQ &&
          currentA.join(' ').trim()
        ) {
          entities.push({
            '@type': 'Question',
            name: currentQ,
            acceptedAnswer: {
              '@type': 'Answer',
              text: currentA.join(' ').trim(),
            },
          })
        }

        currentQ = line.slice(4).trim()
        currentA = []
      } else if (
        currentQ &&
        line.trim()
      ) {
        currentA.push(line.trim())
      }
    }

    if (
      currentQ &&
      currentA.join(' ').trim()
    ) {
      entities.push({
        '@type': 'Question',
        name: currentQ,
        acceptedAnswer: {
          '@type': 'Answer',
          text: currentA.join(' ').trim(),
        },
      })
    }

    if (entities.length > 0) {
      faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: entities,
      }
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BRAND.background,
        paddingBottom: 80,
      }}
    >
      {/* ========================================================
          STRUCTURED DATA
          ======================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />

      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}

      {/* ========================================================
          HERO
          ======================================================== */}

      <section
        style={{
          width: '100%',
          height: 'clamp(360px, 52vh, 560px)',
          position: 'relative',
          background: BRAND.forest,
          overflow: 'hidden',
        }}
      >
        {post.image && (
          <Image
            src={post.image}
            alt={post.title}
            fill
            style={{
              objectFit: 'cover',
              opacity: 0.38,
            }}
            priority
          />
        )}

        {/* Brand gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(
                to top,
                rgba(10,35,27,0.96) 0%,
                rgba(10,35,27,0.72) 42%,
                rgba(10,35,27,0.25) 78%,
                rgba(10,35,27,0.08) 100%
              )
            `,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            paddingBottom: 52,
          }}
        >
          <div
            style={{
              maxWidth: 920,
              margin: '0 auto',
              padding: '0 24px',
              width: '100%',
            }}
          >
            {/* Back link */}
            <Link
              href="/blog"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                color: 'rgba(255,255,255,0.82)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                marginBottom: 22,
              }}
            >
              <ArrowLeft size={14} />
              Back to all posts
            </Link>

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: BRAND.orange,
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '6px 13px',
                  borderRadius: 999,
                }}
              >
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily:
                  'var(--font-bricolage), sans-serif',
                fontSize: 'clamp(28px, 5vw, 50px)',
                color: '#FFFFFF',
                margin: '0 0 22px',
                lineHeight: 1.12,
                fontWeight: 700,
                maxWidth: 820,
                letterSpacing: '-0.025em',
              }}
            >
              {post.title}
            </h1>

            {/* Meta */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                alignItems: 'center',
              }}
            >
              <Link
                href="/team"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                <User size={14} />
                {post.author}
              </Link>

              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: 13,
                }}
              >
                <Calendar size={14} />
                {formatDate(post.date)}
              </span>

              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: 13,
                }}
              >
                <Clock size={14} />
                {post.readingTime} min read
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          ARTICLE CONTENT
          ======================================================== */}

      <main
        style={{
          maxWidth: 820,
          margin: '0 auto',
          padding: '56px 24px 0',
        }}
      >
        {/* Lead / Excerpt */}
        {post.excerpt && (
          <div
            style={{
              background: BRAND.paleGreen,
              borderLeft: `4px solid ${BRAND.green}`,
              borderRadius: '0 14px 14px 0',
              padding: '20px 24px',
              marginBottom: 48,
            }}
          >
            <p
              style={{
                fontFamily:
                  'var(--font-playfair), Georgia, serif',
                fontSize: 18,
                color: BRAND.forest,
                lineHeight: 1.7,
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              {post.excerpt}
            </p>
          </div>
        )}

        {/* Body */}
        <article>
          {renderMarkdown(
            post.content,
            post.slug
          )}
        </article>

        {/* ======================================================
            ARTICLE FOOTER
            ====================================================== */}

        <div
          style={{
            marginTop: 64,
            paddingTop: 26,
            borderTop: `1px solid ${BRAND.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: BRAND.muted,
              fontSize: 13,
            }}
          >
            <Tag
              size={15}
              style={{
                color: BRAND.green,
              }}
            />

            <span
              style={{
                fontWeight: 600,
              }}
            >
              {post.category}
            </span>
          </div>

          <Link
            href="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '10px 18px',
              border: `1px solid ${BRAND.border}`,
              borderRadius: 11,
              color: BRAND.forest,
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              background: '#FFFFFF',
            }}
          >
            <ArrowLeft size={13} />
            Back to Blog
          </Link>
        </div>
      </main>

      {/* ========================================================
          RELATED ARTICLES
          ======================================================== */}

      {relatedPosts.length > 0 && (
        <section
          style={{
            background: BRAND.cream,
            borderTop: `1px solid ${BRAND.border}`,
            padding: '68px 24px',
            marginTop: 68,
          }}
        >
          <div
            style={{
              maxWidth: 820,
              margin: '0 auto',
            }}
          >
            {/* Section divider */}
            <div
              style={{
                width: 44,
                height: 3,
                background: BRAND.orange,
                borderRadius: 999,
                marginBottom: 16,
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 20,
                marginBottom: 32,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <p
                  style={{
                    margin: '0 0 7px',
                    color: BRAND.green,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Continue Reading
                </p>

                <h2
                  style={{
                    fontFamily:
                      'var(--font-bricolage), sans-serif',
                    fontSize: 30,
                    fontWeight: 700,
                    color: BRAND.forest,
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Related Articles
                </h2>
              </div>

              <Link
                href="/blog"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: BRAND.orange,
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                View all articles
                <ArrowRight size={14} />
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 24,
              }}
            >
              {relatedPosts.map((related) => (
                <RelatedPostCard
                  key={related.slug}
                  related={related}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
