import { Smartphone, Truck, MapPin, RefreshCw } from "lucide-react";
import { siteConfig, whatsappLink } from "@/config/site";
import WhatsAppIcon from "@/components/WhatsAppIcon";

// Reassurance under the product's buy buttons. Only shows what is set in siteConfig.
export default function TrustStrip({ productName }: { productName?: string }) {
  const delivery = [siteConfig.deliveryPromise, siteConfig.sameDayCutoff].filter(Boolean).join(" · ");
  const items = [
    { icon: Smartphone, text: "Pay with M-Pesa or card" },
    delivery && { icon: Truck, text: delivery },
    siteConfig.address && {
      icon: MapPin,
      text: `${siteConfig.address}${siteConfig.openingHours ? ` · ${siteConfig.openingHours}` : ""}`,
    },
    siteConfig.returnsPolicy && { icon: RefreshCw, text: siteConfig.returnsPolicy },
  ].filter(Boolean) as { icon: typeof Truck; text: string }[];

  return (
    <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2.5">
      {items.map(({ icon: Icon, text }) => (
        <p key={text} className="flex items-start gap-2.5 text-sm text-slate-600">
          <Icon size={16} className="text-pink-500 mt-0.5 shrink-0" />
          {text}
        </p>
      ))}
      {siteConfig.whatsappNumber && (
        <a
          href={whatsappLink(productName ? `Hi MiniMingle, I have a question about: ${productName}` : undefined)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-sm font-medium text-green-700 hover:text-green-800 pt-1"
        >
          <WhatsAppIcon size={16} className="shrink-0" />
          Ask us about this on WhatsApp
        </a>
      )}
    </div>
  );
}
