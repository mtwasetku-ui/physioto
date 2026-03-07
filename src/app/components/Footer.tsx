import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
            <Link href="/">
              <Image
                src="/images/logo.png"
                alt="Physio to Home"
                width={160}
                height={60}
                className="h-16 w-auto brightness-200"
              />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Providing professional physiotherapy services in the comfort of your home across Tasmania for over 15 years. Your health, our priority.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[['Services', '/services'], ['Our Team', '/team'], ['Blog', '/blog'], ['Book Appointment', '/booking'], ['Contact Us', '/contact']].map(([name, path]) => (
                <li key={path}>
                  <Link href={path} className="text-sm hover:text-blue-400 transition-colors">{name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Phone</p>
                  <a href="tel:1300433233" className="text-sm hover:text-blue-400 transition-colors">1300 433 233</a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Email</p>
                  <a href="mailto:info@physiotohome.com" className="text-sm hover:text-blue-400 transition-colors">info@physiotohome.com</a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Location</p>
                  <p className="text-sm">Serving communities across Tasmania</p>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              {[
                { href: 'https://facebook.com', Icon: Facebook, hover: 'hover:bg-blue-600' },
                { href: 'https://instagram.com', Icon: Instagram, hover: 'hover:bg-pink-600' },
                { href: 'https://linkedin.com', Icon: Linkedin, hover: 'hover:bg-blue-700' },
              ].map(({ href, Icon, hover }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  className={`w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center ${hover} transition-colors`}>
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <div className="mt-6">
              <p className="text-sm text-gray-400">
                <span className="font-medium text-white">Business Hours:</span><br />
                Monday - Friday: 8am - 6pm<br />
                Saturday: 9am - 2pm<br />
                Sunday: Closed
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">© {currentYear} Physio to Home. All rights reserved.</p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
