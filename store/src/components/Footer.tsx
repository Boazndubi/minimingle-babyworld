import Link from "next/link";
import { Baby, Phone, Mail, MapPin, Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

const trustItems = [
  { icon: Truck, title: "Delivery at fair price", desc: "or pick up at our store" },
  { icon: ShieldCheck, title: "Quality Assured", desc: "Verified safe products" },
  { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
  { icon: Headphones, title: "24/7 Support", desc: "WhatsApp & live chat" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">

      {/* Trust Bar */}
      <div className="border-b border-slate-800 px-4 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6 text-center">
          {trustItems.map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-2">
              <div className="bg-slate-800 p-2.5 rounded-full">
                <item.icon size={18} className="text-pink-400" />
              </div>
              <p className="font-semibold text-white text-xs sm:text-sm">{item.title}</p>
              <p className="text-[10px] sm:text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 text-sm">

        {/* Brand */}
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Baby size={20} className="text-pink-400" />
            <span className="font-bold text-white text-base">MiniMingle</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Premium baby products for every milestone. Trusted by thousands of parents across Kenya.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">Quick Links</h4>
          <ul className="space-y-1.5 text-xs">
            {[
              { label: "Home", href: "/" },
              { label: "Products", href: "/products" },
              { label: "Categories", href: "/categories" },
              { label: "Cart", href: "/cart" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-pink-400 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Milestones */}
        <div>
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">Milestones</h4>
          <ul className="space-y-1.5 text-xs">
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
        <div className="col-span-2 lg:col-span-1">
          <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">Contact Us</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <Phone size={12} className="text-pink-400 flex-shrink-0" />
              <span>+254 712 345 678</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={12} className="text-pink-400 flex-shrink-0" />
              <span>hello@minimingle.co.ke</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={12} className="text-pink-400 flex-shrink-0 mt-0.5" />
              <span>Nairobi, Kenya</span>
            </li>
          </ul>

          <div className="mt-4">
            <p className="text-[11px] text-slate-400 mb-2">Subscribe for deals & updates</p>
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

      <div className="border-t border-slate-800 px-4 py-4 text-center text-[11px] text-slate-500">
        © {new Date().getFullYear()} MiniMingleBabyWorld. All rights reserved.
      </div>
    </footer>
  );
}