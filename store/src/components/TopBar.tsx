import { Truck } from "lucide-react";
import { siteConfig, whatsappLink } from "@/config/site";
import WhatsAppIcon from "@/components/WhatsAppIcon";

// Thin announcement bar above the header: delivery promise + WhatsApp.
export default function TopBar() {
  const delivery = [siteConfig.deliveryPromise, siteConfig.sameDayCutoff].filter(Boolean).join(" · ");
  if (!delivery && !siteConfig.whatsappNumber) return null;

  return (
    <div className="bg-pink-600 text-white text-xs">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-center gap-x-5 gap-y-1 flex-wrap text-center">
        {delivery && (
          <span className="flex items-center gap-1.5">
            <Truck size={13} className="shrink-0" />
            {delivery}
          </span>
        )}
        {siteConfig.whatsappNumber && (
          <a
            href={whatsappLink("Hi MiniMingle, I have a question")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-medium underline-offset-2 hover:underline"
          >
            <WhatsAppIcon size={13} className="shrink-0" />
            Order on WhatsApp {siteConfig.phoneDisplay}
          </a>
        )}
      </div>
    </div>
  );
}
