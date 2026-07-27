'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Calendar, ArrowRight } from 'lucide-react'
import type { BlogPost } from '@/lib/blog'

export default function RelatedPostCard({
  related,
}: {
  related: BlogPost
}) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Link
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
          fontFamily: "var(--font-playfair), Georgia, serif",
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
  )
}
