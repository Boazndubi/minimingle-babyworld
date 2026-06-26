"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Truck, ShieldCheck, RotateCcw, Headphones, Baby, ChevronRight } from "lucide-react";

const milestones = [
  { label: "Newborn", value: "newborn" },
  { label: "Teething", value: "teething" },
  { label: "Crawling", value: "crawling" },
  { label: "Walking", value: "walking" },
  { label: "Potty Training", value: "potty_training" },
];

const trustItems = [
  { icon: Truck, title: "Free Delivery", desc: "On orders over KES 3,000" },
  { icon: ShieldCheck, title: "Quality Assured", desc: "All products verified safe" },
  { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
  { icon: Headphones, title: "24/7 Support", desc: "WhatsApp & live chat" },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products?limit=8&sort=newest")
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="w-full min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
          <div className="bg-white shadow-md p-4 rounded-full">
            <Baby size={40} className="text-pink-500" />
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-slate-800 leading-tight">
            Everything Your{" "}
            <span className="text-pink-600">Baby Needs</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-md">
            Shop milestone-based baby products curated for every stage of your little one's journey.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="/products"
              className="bg-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-pink-700 transition-colors shadow-md">
              Shop Now
            </Link>
            <Link
              href="/categories"
              className="border-2 border-pink-400 text-pink-600 px-8 py-3 rounded-full font-semibold hover:bg-pink-50 transition-colors">
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Shop By Milestone</h2>
          <div className="flex gap-3 flex-wrap justify-center">
            {milestones.map((m) => (
              <Link
                key={m.value}
                href={`/products?milestone=${m.value}`}
                className="flex items-center gap-2 bg-pink-50 text-pink-700 px-5 py-2 rounded-full text-sm font-medium hover:bg-pink-100 transition-colors border border-pink-200">
                {m.label}
                <ChevronRight size={14} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Featured Products</h2>
            <Link href="/products" className="text-pink-600 text-sm font-medium hover:underline flex items-center gap-1">
              View All <ChevronRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-200 rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-slate-400 text-center py-12">No products yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 px-4 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {trustItems.map((item) => (
            <div key={item.title} className="flex flex-col items-center gap-3">
              <div className="bg-pink-50 p-3 rounded-full">
                <item.icon size={22} className="text-pink-600" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">{item.title}</p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}