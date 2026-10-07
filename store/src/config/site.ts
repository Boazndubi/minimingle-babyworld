// Single place for the shop details shown across the storefront.
// Anything left as an empty string is simply not shown, so fill these in as you
// confirm them and the top bar, product pages, cart and footer update together.
export const siteConfig = {
  name: "MiniMingle",

  // WhatsApp number in international format, digits only (no +, spaces or dashes).
  // Taken from the number already shown in the footer - please confirm it is the
  // WhatsApp line. The old link pointed at a placeholder (254712345678).
  whatsappNumber: "254112815454",
  // How the number is displayed to customers.
  phoneDisplay: "+254 112 815 454",
  email: "hello@minimingle.co.ke",

  // Shop details. Empty = hidden. Examples:
  //   address: "Shop F12, Moi Avenue, Nairobi CBD"
  //   openingHours: "Mon-Sat 8:30am-7pm"
  address: "",
  openingHours: "",

  // Delivery and returns wording. Keep these to what you can actually deliver.
  deliveryPromise: "Delivery across Nairobi & surroundings",
  // e.g. "Order before 4pm for same-day delivery". Leave empty until it is real.
  sameDayCutoff: "",
  returnsPolicy: "7-day return policy",

  // Small badge on the home page hero.
  heroBadge: "Baby products for every milestone",
};

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${siteConfig.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
