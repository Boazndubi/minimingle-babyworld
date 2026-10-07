import { Baby, Phone, Mail, MapPin, MessageCircle, Camera, Music2, Clock } from "lucide-react";
import { siteConfig, whatsappLink } from "@/config/site";
import NewsletterForm from "@/components/NewsletterForm";

const socialLinks = [
  { icon: MessageCircle, label: "WhatsApp", handle: siteConfig.phoneDisplay, href: whatsappLink() },
  { icon: Camera, label: "Instagram", handle: "@MiniMingle.ke", href: "https://instagram.com/MiniMingle.ke" },
  { icon: Music2, label: "TikTok", handle: "@MiniMingle.ke", href: "https://tiktok.com/@MiniMingle.ke" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <Baby size={22} className="text-pink-400 flex-shrink-0" />
                <span className="font-bold text-white text-lg">MiniMingle</span>
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
                <span>{siteConfig.phoneDisplay}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={12} className="text-pink-400 flex-shrink-0" />
                <span>{siteConfig.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={12} className="text-pink-400 flex-shrink-0 mt-0.5" />
                <span>{siteConfig.address || "Nairobi, Kenya"}</span>
              </li>
              {siteConfig.openingHours && (
                <li className="flex items-center gap-2">
                  <Clock size={12} className="text-pink-400 flex-shrink-0" />
                  <span>{siteConfig.openingHours}</span>
                </li>
              )}
            </ul>
            <div className="mt-4">
              <p className="text-[11px] text-slate-400 mb-2">Subscribe for deals & updates</p>
              <NewsletterForm />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} MiniMingle BabyWorld · Built by BOAZ.N.BUINDI
        </div>
      </div>
    </footer>
  );
}