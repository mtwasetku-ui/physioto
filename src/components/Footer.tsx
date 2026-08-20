import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Linkedin,
  Star,
} from 'lucide-react'

const quickLinks = [
  ['Services', '/services'],
  ['Our Team', '/team'],
  ['Blog', '/blog'],
  ['Book Appointment', '/booking'],
  ['Contact Us', '/contact'],
] as const

const areasWeCover = [
  ['Hobart', '/blog/home-physiotherapy-hobart'],
  ['Launceston', '/blog/home-physiotherapy-launceston'],
  ['Devonport & Burnie', '/blog/home-physiotherapy-devonport-burnie'],
  ['Deloraine', '/blog/home-physiotherapy-deloraine'],
  ['George Town', '/blog/home-physiotherapy-george-town'],
  ['Longford', '/blog/home-physiotherapy-longford'],
  ['Scottsdale', '/blog/home-physiotherapy-scottsdale'],
  [
    'Tamar Valley, Exeter & Beaconsfield',
    '/blog/home-physiotherapy-tamar-valley-exeter-beaconsfield',
  ],
] as const

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--pth-forest)] text-[#D7E3DC]">

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="space-y-5">
            <Link
              href="/"
              aria-label="Physio to Home - Home"
              className="inline-block"
            >
              <Image
                src="/images/logo.png"
                alt="Physio to Home"
                width={160}
                height={80}
                className="h-16 w-auto object-contain brightness-0 invert"
              />
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-[#C4D3CB]">
              Providing professional physiotherapy services in the comfort
              of your home in Launceston and across Tasmania for over 15
              years. Your health, our priority.
            </p>

            <Link
              href="/booking"
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                bg-[var(--pth-orange)]
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-[var(--pth-orange-dark)]
                hover:shadow-md
              "
            >
              Book an Appointment
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-white">
              Quick Links
            </h3>

            <ul className="space-y-3">
              {quickLinks.map(([name, path]) => (
                <li key={path}>
                  <Link
                    href={path}
                    className="
                      text-sm
                      text-[#C4D3CB]
                      transition-colors
                      hover:text-[var(--pth-orange)]
                    "
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-white">
              Contact Us
            </h3>

            <ul className="space-y-5">

              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--pth-sage)]" />

                <div>
                  <p className="text-sm font-semibold text-white">
                    Phone
                  </p>

                  <a
                    href="tel:1300433233"
                    className="
                      text-sm
                      text-[#C4D3CB]
                      transition-colors
                      hover:text-[var(--pth-orange)]
                    "
                  >
                    1300 433 233
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--pth-sage)]" />

                <div>
                  <p className="text-sm font-semibold text-white">
                    Email
                  </p>

                  <a
                    href="mailto:info@physiotohome.com"
                    className="
                      text-sm
                      text-[#C4D3CB]
                      transition-colors
                      hover:text-[var(--pth-orange)]
                    "
                  >
                    info@physiotohome.com
                  </a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--pth-sage)]" />

                <div>
                  <p className="text-sm font-semibold text-white">
                    Location
                  </p>

                  <p className="text-sm leading-relaxed text-[#C4D3CB]">
                    Based in Launceston, serving all of Tasmania
                  </p>
                </div>
              </li>

            </ul>
          </div>

          {/* Social / Hours */}
          <div>
            <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-white">
              Follow Us
            </h3>

            <div className="flex gap-3">

              <a
                href="https://www.facebook.com/profile.php?id=61565914211504"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Physio to Home on Facebook"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[var(--pth-dark)]
                  text-white
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:bg-[var(--pth-orange)]
                "
              >
                <Facebook className="h-5 w-5" />
              </a>

              <a
                href="https://www.linkedin.com/company/physio-to-home/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Physio to Home on LinkedIn"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[var(--pth-dark)]
                  text-white
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:bg-[var(--pth-orange)]
                "
              >
                <Linkedin className="h-5 w-5" />
              </a>

            </div>

            {/* Google Review */}
            <a
              href="https://g.page/r/CZtUAxvGoYdLEBM/review"
              target="_blank"
              rel="noopener noreferrer"
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-[var(--pth-dark)]
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-[var(--pth-yellow)]
                hover:text-[var(--pth-forest)]
              "
            >
              <Star className="h-4 w-4" />
              Leave us a review
            </a>

            {/* Hours */}
            <div className="mt-6">
              <p className="text-sm leading-relaxed text-[#C4D3CB]">
                <span className="font-semibold text-white">
                  Business Hours:
                </span>
                <br />
                Monday - Saturday: 9am - 5pm
                <br />
                Sunday: Closed
              </p>
            </div>
          </div>
        </div>

        {/* Areas */}
        <div className="mt-14 border-t border-white/10 pt-8">
          <h3 className="mb-5 text-sm font-bold uppercase tracking-[0.12em] text-white">
            Areas We Cover
          </h3>

          <div className="flex flex-wrap gap-x-2 gap-y-2 text-sm">
            {areasWeCover.map(([name, path], i, arr) => (
              <span
                key={path}
                className="flex items-center"
              >
                <Link
                  href={path}
                  className="
                    text-[#AFC3B8]
                    transition-colors
                    hover:text-[var(--pth-orange)]
                  "
                >
                  {name}
                </Link>

                {i < arr.length - 1 && (
                  <span className="ml-2 text-white/20">
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="mt-8 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">

            <p className="text-sm text-[#91A99C]">
              © {currentYear} Physio to Home. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">

              <Link
                href="/privacy-policy"
                className="
                  text-[#91A99C]
                  transition-colors
                  hover:text-[var(--pth-orange)]
                "
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms-of-service"
                className="
                  text-[#91A99C]
                  transition-colors
                  hover:text-[var(--pth-orange)]
                "
              >
                Terms of Service
              </Link>

              <Link
                href="/portal"
                className="
                  text-[#718A7D]
                  transition-colors
                  hover:text-white
                "
              >
                Staff Login
              </Link>

            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
