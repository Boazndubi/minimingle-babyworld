import Link from "next/link";
import { Baby, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Baby size={22} className="text-pink-400" />
            <span className="font-bold text-white text-lg">MiniMingle</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Premium baby products for every milestone. Trusted by thousands of parents across Kenya.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-white mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: "Categories", href: "/categories" },
              { label: "Cart", href: "/cart" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href}
                  className="hover:text-pink-400 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Milestones */}
        <div>
          <h4 className="font-semibold text-white mb-4">Shop By Milestone</h4>
          <ul className="space-y-2 text-sm">
            {["Newborn", "Teething", "Crawling", "Walking", "Potty Training"].map((m) => (
              <li key={m}>
                <Link href={`/products?milestone=${m.toLowerCase().replace(" ", "_")}`}
                  className="hover:text-pink-400 transition-colors">
                  {m}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-white mb-4">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-pink-400 flex-shrink-0" />
              <span>+254 712 345 678</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-pink-400 flex-shrink-0" />
              <span>hello@minimingle.co.ke</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={14} className="text-pink-400 flex-shrink-0 mt-0.5" />
              <span>Nairobi, Kenya</span>
            </li>
          </ul>

          {/* Newsletter */}
          <div className="mt-6">
            <p className="text-xs text-slate-400 mb-2">Subscribe for deals & updates</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <button className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} MiniMingleBabyWorld. All rights reserved.
      </div>
    </footer>
  );
}