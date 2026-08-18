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
    new Date(d).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  return (
    <Link
      href={`/blog/${related.slug}`}
      className="
        group
        flex
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-[var(--pth-border)]
        bg-white
        no-underline
        shadow-[0_1px_4px_rgba(10,35,27,0.06)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_16px_36px_rgba(10,35,27,0.12)]
      "
    >
      {/* Image */}
      <div className="relative h-40 w-full overflow-hidden bg-[var(--pth-pale-green)]">
        {related.image ? (
          <Image
            src={related.image}
            alt={related.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display text-5xl font-bold text-[var(--pth-sage)]">
            P
          </span>
        )}

        {/* Category */}
        <div className="absolute left-3 top-3">
          <span className="
            rounded-full
            bg-white/95
            px-3
            py-1
            text-[10px]
            font-bold
            uppercase
            tracking-wide
            text-[var(--pth-green)]
            shadow-sm
          ">
            {related.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">

        {/* Date */}
        <p className="mb-2 flex items-center gap-1 text-xs text-[var(--pth-muted)]">
          <Calendar size={11} />
          {formatDate(related.date)}
        </p>

        {/* Title */}
        <h3 className="
          mb-2
          line-clamp-2
          font-display
          text-[15px]
          font-bold
          leading-[1.4]
          text-[var(--pth-forest)]
        ">
          {related.title}
        </h3>

        {/* Excerpt */}
        <p className="
          mb-4
          line-clamp-2
          flex-1
          text-[13px]
          leading-relaxed
          text-[var(--pth-muted)]
        ">
          {related.excerpt}
        </p>

        {/* Read More */}
        <span className="
          inline-flex
          items-center
          gap-1
          text-[13px]
          font-semibold
          text-[var(--pth-orange)]
          transition-colors
          group-hover:text-[var(--pth-orange-dark)]
        ">
          Read Article
          <ArrowRight
            size={12}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
    </Link>
  )
}
