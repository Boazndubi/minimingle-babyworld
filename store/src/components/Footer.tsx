"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Baby,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Camera,
  Music2,
  ChevronUp,
} from "lucide-react";

const socialLinks = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    handle: "+254 757111222",
    href: "https://wa.me/254712345678",
  },
  {
    icon: Camera,
    label: "Instagram",
    handle: "@AromaLine.ke",
    href: "https://instagram.com/aromaline.ke",
  },
  {
    icon: Music2,
    label: "TikTok",
    handle: "@AromaLine.ke",
    href: "https://tiktok.com/@aromaline.ke",
  },
];

export default function Footer() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Check if near bottom (within 100px)
      const isNearBottom = currentScrollY + windowHeight >= documentHeight - 100;
      setAtBottom(isNearBottom);

      // Show footer when:
      // 1. Scrolling up
      // 2. Near the bottom of page
      // 3. At the very top
      if (
        currentScrollY < lastScrollY ||
        isNearBottom ||
        currentScrollY < 100
      ) {
        setVisible(true);
      } else {
        // Hide when scrolling down and not near bottom
        setVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Spacer to prevent content jump when footer hides */}
      <div className="h-[60px] md:h-0" />

      <footer
        className={`fixed md:relative bottom-0 left-0 right-0 z-40 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out md:translate-y-0
          ${visible || atBottom ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Mobile: Collapsed bar (always visible mini footer) */}
        <div className="md:hidden">
          <div className="mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">© Aroma Line</span>
            <button
              onClick={() => setVisible(!visible)}
              className="flex items-center gap-1 text-xs text-pink-400 font-medium"
            >
              {visible ? (
                <>
                  Hide <ChevronUp size={14} />
                </>
              ) : (
                "Show More"
              )}
            </button>
          </div>
        </div>

        {/* Full footer content - hidden on mobile when collapsed */}
        <div
          className={`md:block ${
            visible ? "block" : "hidden"
          }`}
        >
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-8 text-sm">
              {/* Brand */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <Baby size={20} className="text-pink-400" />
                  <span className="font-bold text-white text-base">
                    Aroma Line
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Premium baby products for every milestone. Trusted by thousands
                  of parents across Kenya.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">
                  Quick Links
                </h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <Link
                      href="/"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/categories"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Categories
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/cart"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Cart
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Milestones */}
              <div>
                <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">
                  Milestones
                </h4>
                <ul className="space-y-2 text-xs">
                  <li>
                    <Link
                      href="/products?milestone=newborn"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Newborn
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?milestone=teething"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Teething
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?milestone=crawling"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Crawling
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?milestone=walking"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Walking
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?milestone=potty_training"
                      className="hover:text-pink-400 transition-colors"
                    >
                      Potty Training
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Social */}
              <div>
                <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">
                  Follow Us
                </h4>
                <ul className="space-y-3 text-xs">
                  {socialLinks.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 group"
                      >
                        <social.icon
                          size={14}
                          className="text-pink-400 flex-shrink-0 mt-0.5 group-hover:text-pink-300 transition-colors"
                        />
                        <div>
                          <p className="text-white font-medium group-hover:text-pink-300 transition-colors">
                            {social.label}
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            {social.handle}
                          </p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="col-span-2 sm:col-span-1">
                <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">
                  Contact Us
                </h4>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2">
                    <Phone
                      size={12}
                      className="text-pink-400 flex-shrink-0"
                    />
                    <span>+254 712 345 678</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail
                      size={12}
                      className="text-pink-400 flex-shrink-0"
                    />
                    <span>hello@AromaLine.co.ke</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <MapPin
                      size={12}
                      className="text-pink-400 flex-shrink-0 mt-0.5"
                    />
                    <span>Nairobi, Kenya</span>
                  </li>
                </ul>

                <div className="mt-4">
                  <p className="text-[11px] text-slate-400 mb-2">
                    Subscribe for deals & updates
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <button className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-pink-700 transition-colors flex-shrink-0">
                      Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-[11px] text-slate-500">
              © {new Date().getFullYear()} Aroma Line — MSc Information Science
              Web Design Project · Erick Bundi
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}