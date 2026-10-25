// Small shared renderers for the dashboard (posts and replies).

// Server renders in UTC, the browser in local time — suppress the harmless
// text mismatch rather than flash a wrong time.
export function When({ iso }: { iso: string }) {
  const d = new Date(iso)
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {d.toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
    </time>
  )
}

// Plain text with clickable http(s) links. Built as React nodes — never
// injected as HTML.
export function PostBody({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<]+)/g)
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
      {parts.map((part, i) => {
        if (!/^https?:\/\//.test(part)) return part
        const trimmed = part.replace(/[.,;:!?)\]]+$/, '')
        const trailing = part.slice(trimmed.length)
        return (
          <span key={i}>
            <a href={trimmed} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              {trimmed}
            </a>
            {trailing}
          </span>
        )
      })}
    </p>
  )
}
