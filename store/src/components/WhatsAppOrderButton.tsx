"use client";
import { MessageCircle } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { siteConfig, whatsappLink } from "@/config/site";

// Opens WhatsApp with the cart pre-filled so a customer can ask about, or arrange,
// their order by chat. It does not create an order in the system.
export default function WhatsAppOrderButton({ className = "" }: { className?: string }) {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  if (!siteConfig.whatsappNumber || items.length === 0) return null;

  const lines = items.map((i) => `- ${i.quantity} x ${i.name} (KES ${(i.price * i.quantity).toLocaleString()})`);
  const message = `Hi MiniMingle, I'd like help with this order:\n${lines.join("\n")}\nTotal: KES ${total().toLocaleString()}`;

  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 w-full rounded-full border border-green-600 text-green-700 py-3 text-sm font-medium hover:bg-green-50 transition-colors ${className}`}
    >
      <MessageCircle size={16} />
      Chat about this order on WhatsApp
    </a>
  );
}
