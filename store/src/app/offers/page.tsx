"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Percent, Tag } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

type Promotion = {
  id: string;
  name: string;
  type: string;
  value: number | string;
  couponCode?: string | null;
  minimumOrder?: number | string;
  startDate: string;
  endDate?: string | null;
  appliesToAll: boolean;
};

export default function OffersPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/promotions")
      .then((res) => setPromotions(res.data || []))
      .catch(() => setError("Offers are temporarily unavailable. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Promo code copied");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 min-h-[60vh]">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center bg-pink-50 p-4 rounded-full mb-4">
          <Percent size={28} className="text-pink-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">MiniMingle Offers</h1>
        <p className="text-slate-500 mt-2">Save more on thoughtful products for every milestone.</p>
      </div>

      {loading ? (
        <div className="flex flex-wrap justify-center gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-64 w-full sm:w-80 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600">{error}</div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No active offers right now.</p>
          <Link href="/products" className="inline-block mt-4 text-pink-600 font-medium hover:underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {promotions.map((promotion) => (
            <article
              key={promotion.id}
              className="w-full sm:w-80 bg-white border border-pink-100 rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
            >
              {/* Discount banner */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-5 text-white">
                <p className="text-3xl font-extrabold leading-none">
                  {promotion.type === "PERCENTAGE"
                    ? `${promotion.value}% OFF`
                    : `KES ${Number(promotion.value).toLocaleString()} OFF`}
                </p>
                <p className="text-sm font-medium text-pink-50 mt-1 truncate">{promotion.name}</p>
              </div>

              <div className="p-6 flex flex-col flex-1">
                {promotion.couponCode && (
                  <button
                    onClick={() => copyCode(promotion.couponCode as string)}
                    className="w-full flex items-center justify-between border border-dashed border-pink-300 bg-pink-50 rounded-xl px-3 py-2.5 text-sm hover:bg-pink-100 transition-colors"
                  >
                    <span className="font-mono font-bold text-pink-700 tracking-wide">
                      {promotion.couponCode}
                    </span>
                    <Copy size={15} className="text-pink-500 flex-shrink-0" />
                  </button>
                )}

                <div className="mt-4 space-y-1 text-xs text-slate-500">
                  <p>
                    {Number(promotion.minimumOrder || 0) > 0
                      ? `Minimum order: KES ${Number(promotion.minimumOrder).toLocaleString()}`
                      : "No minimum order"}
                  </p>
                  <p>
                    Ends: {promotion.endDate
                      ? new Date(promotion.endDate).toLocaleDateString("en-KE")
                      : "No expiry"}
                  </p>
                </div>

                <Link
                  href="/products"
                  className="block text-center mt-auto pt-5 bg-pink-600 text-white rounded-full py-2.5 text-sm font-medium hover:bg-pink-700 transition-colors"
                >
                  Shop this offer
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}