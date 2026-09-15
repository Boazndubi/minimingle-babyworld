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
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center bg-pink-50 p-4 rounded-full mb-4">
          <Percent size={28} className="text-pink-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">MiniMingle Offers</h1>
        <p className="text-slate-500 mt-2">Save more on thoughtful products for every milestone.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((item) => <div key={item} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600">{error}</div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No active offers right now.</p>
          <Link href="/products" className="inline-block mt-4 text-pink-600 font-medium hover:underline">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {promotions.map((promotion) => (
            <article key={promotion.id} className="bg-white border border-pink-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-slate-800">{promotion.name}</h2>
                <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-full">
                  {promotion.type === "PERCENTAGE" ? `${promotion.value}% off` : `KES ${Number(promotion.value).toLocaleString()} off`}
                </span>
              </div>
              {promotion.couponCode && (
                <button onClick={() => copyCode(promotion.couponCode as string)} className="mt-5 w-full flex items-center justify-between border border-dashed border-pink-300 bg-pink-50 rounded-xl px-3 py-2 text-sm">
                  <span className="font-mono font-bold text-pink-700">{promotion.couponCode}</span>
                  <Copy size={15} className="text-pink-500" />
                </button>
              )}
              <p className="text-xs text-slate-500 mt-4">
                {Number(promotion.minimumOrder || 0) > 0 ? `Minimum order: KES ${Number(promotion.minimumOrder).toLocaleString()}` : "No minimum order"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Ends: {promotion.endDate ? new Date(promotion.endDate).toLocaleDateString("en-KE") : "No expiry"}
              </p>
              <Link href="/products" className="block text-center mt-5 bg-pink-600 text-white rounded-full py-2.5 text-sm font-medium hover:bg-pink-700">Shop this offer</Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
