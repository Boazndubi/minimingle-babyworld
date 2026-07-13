import Link from "next/link";
import { Baby, Phone, Mail, MapPin, MessageCircle, Camera, Music2 } from "lucide-react";

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
  return (
    <footer className="bg-slate-900 text-slate-300 w-full">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6 text-sm">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Baby size={24} className="text-pink-400" />
              <span className="font-bold text-white text-lg">Aroma Line</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Premium baby products for every milestone. Trusted by thousands of parents across Kenya.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-pink-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-pink-400 transition-colors">Products</Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-pink-400 transition-colors">Categories</Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-pink-400 transition-colors">Cart</Link>
              </li>
            </ul>
          </div>

          {/* Milestones */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Milestones</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products?milestone=newborn" className="hover:text-pink-400 transition-colors">Newborn</Link>
              </li>
              <li>
                <Link href="/products?milestone=teething" className="hover:text-pink-400 transition-colors">Teething</Link>
              </li>
              <li>
                <Link href="/products?milestone=crawling" className="hover:text-pink-400 transition-colors">Crawling</Link>
              </li>
              <li>
                <Link href="/products?milestone=walking" className="hover:text-pink-400 transition-colors">Walking</Link>
              </li>
              <li>
                <Link href="/products?milestone=potty_training" className="hover:text-pink-400 transition-colors">Potty Training</Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Follow Us</h4>
            <ul className="space-y-3 text-sm">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 group"
                  >
                    <social.icon size={16} className="text-pink-400 flex-shrink-0 mt-0.5 group-hover:text-pink-300 transition-colors" />
                    <div>
                      <p className="text-white font-medium group-hover:text-pink-300 transition-colors">
                        {social.label}
                      </p>
                      <p className="text-slate-400 text-xs">{social.handle}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="text-pink-400 flex-shrink-0" />
                <span>+254 712 345 678</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="text-pink-400 flex-shrink-0" />
                <span>hello@AromaLine.co.ke</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="text-pink-400 flex-shrink-0 mt-0.5" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm text-slate-400 mb-2">Subscribe for deals & updates</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors flex-shrink-0">
                  Join
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Aroma Line — MSc Information Science Web Design Project · Erick Bundi
        </div>
      </div>
    </footer>
  );
}