import Image from 'next/image'

// Fallback page NextAuth can redirect to after requesting a magic link.
// The login page's own inline "Check your email" state handles the normal
// flow (signIn is called with redirect:false there); this page only
// matters if that flow is bypassed.
export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <Image src="/images/logo.png" alt="Physio to Home" width={56} height={56} className="mx-auto" />
        <h1 className="serif text-2xl text-primary font-semibold mt-4">Check your email</h1>
        <p className="text-muted-foreground text-sm mt-2">
          We sent you a sign-in link. It expires in 15 minutes.
        </p>
      </div>
    </div>
  )
}

