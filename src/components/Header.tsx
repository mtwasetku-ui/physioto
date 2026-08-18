'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'Team', path: '/team' },
  { name: 'Blog', path: '/blog' },
  { name: 'Booking', path: '/booking' },
  { name: 'Contact', path: '/contact' },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--pth-border)] bg-[var(--pth-background)]/95 backdrop-blur-md shadow-[0_2px_16px_rgba(10,35,27,0.06)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            aria-label="Physio to Home - Home"
            className="flex h-20 w-auto items-center"
          >
            <Image
              src="/images/logo.png"
              alt="Physio to Home"
              width={200}
              height={200}
              className="h-16 w-16 object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden items-center space-x-1 lg:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                aria-current={isActive(link.path) ? 'page' : undefined}
                className={`rounded-lg px-4 py-2.5 text-[15px] font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-[var(--pth-pale-green)] text-[var(--pth-forest)]'
                    : 'text-[var(--pth-text)] hover:bg-[var(--pth-pale-green)]/60 hover:text-[var(--pth-green)]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Contact + CTA */}
          <div className="hidden items-center space-x-4 lg:flex">
            <a
              href="tel:1300433233"
              className="flex items-center text-[var(--pth-text)] transition-colors hover:text-[var(--pth-green)]"
              aria-label="Call Physio to Home on 1300 433 233"
            >
              <Phone className="mr-2 h-4 w-4" />
              <span className="text-[15px] font-medium">
                1300 433 233
              </span>
            </a>

            <Link href="/booking">
              <Button
                className="
                  rounded-xl
                  bg-[var(--pth-orange)]
                  px-5
                  py-2.5
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:bg-[var(--pth-orange-dark)]
                  hover:shadow-md
                  focus-visible:ring-2
                  focus-visible:ring-[var(--pth-orange)]
                  focus-visible:ring-offset-2
                "
              >
                Book Appointment
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            className="
              rounded-xl
              p-2.5
              text-[var(--pth-forest)]
              transition-colors
              hover:bg-[var(--pth-pale-green)]
              lg:hidden
            "
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="border-t border-[var(--pth-border)] py-4 lg:hidden">
            <nav
              className="flex flex-col space-y-1"
              aria-label="Mobile navigation"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isActive(link.path) ? 'page' : undefined}
                  className={`rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-[var(--pth-pale-green)] text-[var(--pth-forest)]'
                      : 'text-[var(--pth-text)] hover:bg-[var(--pth-pale-green)]/60 hover:text-[var(--pth-green)]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Mobile Contact */}
              <div className="mt-3 space-y-3 border-t border-[var(--pth-border)] pt-4">
                <a
                  href="tel:1300433233"
                  className="
                    flex
                    items-center
                    rounded-xl
                    px-4
                    py-3
                    text-[var(--pth-text)]
                    transition-colors
                    hover:bg-[var(--pth-pale-green)]
                  "
                >
                  <Phone className="mr-2 h-4 w-4 text-[var(--pth-green)]" />
                  <span className="text-sm font-semibold">
                    1300 433 233
                  </span>
                </a>

                <Link
                  href="/booking"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-1"
                >
                  <Button
                    className="
                      h-12
                      w-full
                      rounded-xl
                      bg-[var(--pth-orange)]
                      font-semibold
                      text-white
                      shadow-sm
                      transition-all
                      hover:bg-[var(--pth-orange-dark)]
                      hover:shadow-md
                    "
                  >
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
