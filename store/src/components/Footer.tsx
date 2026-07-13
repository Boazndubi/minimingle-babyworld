import { Baby, Phone, Mail, MapPin, MessageCircle, Camera, Music2 } from "lucide-react";

const socialLinks = [
  { icon: MessageCircle, label: "WhatsApp", handle: "+254 712 345 678", href: "https://wa.me/254712345678" },
  { icon: Camera, label: "Instagram", handle: "@AromaLine.ke", href: "https://instagram.com/AromaLine.ke" },
  { icon: Music2, label: "TikTok", handle: "@AromaLine.ke", href: "https://tiktok.com/@Aroma Lin.ke" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <Baby size={22} className="text-pink-400 flex-shrink-0" />
            <span className="font-bold text-white text-lg">Aroma Lin</span>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">Follow Us</h4>
            <ul className="space-y-3 text-xs">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 group">
                    <social.icon size={14} className="text-pink-400 group-hover:text-pink-300 transition-colors" />
                    <div>
                      <p className="text-white font-medium group-hover:text-pink-300 transition-colors">{social.label}</p>
                      <p className="text-slate-400 text-[11px]">{social.handle}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-xs uppercase tracking-wide">Contact Us</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <Phone size={12} className="text-pink-400 flex-shrink-0" />
                <span>+254  757111222</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={12} className="text-pink-400 flex-shrink-0" />
                <span>hello@Aroma Lin.co.ke</span>
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
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} MSc Information Science Web Design Project · Erick Bundi.
        </div>
      </div>
    </footer>
  );
}