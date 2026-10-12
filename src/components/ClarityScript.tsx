'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

const CLARITY_ID = 'ywkn1ehp6k'

// Staff-only areas. These show patient details and notes, so session
// recording is never loaded here.
const EXCLUDED_PREFIXES = ['/portal', '/admin', '/api']

export default function ClarityScript() {
  const pathname = usePathname() ?? ''

  const excluded = EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (excluded) return null

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_ID}");
      `}
    </Script>
  )
}
