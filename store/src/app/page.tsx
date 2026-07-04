"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import GridMotion from "@/components/GridMotion";
import {
  ChevronRight, Truck, ShieldCheck, RefreshCw, MessageCircle,
  Baby, Smile, Wind, Footprints, Star, ShoppingBag
} from "lucide-react";

const milestones = [
  { label: "Newborn", value: "newborn", icon: Baby },
  { label: "Teething", value: "teething", icon: Smile },
  { label: "Crawling", value: "crawling", icon: Wind },
  { label: "Walking", value: "walking", icon: Footprints },
  { label: "Potty Training", value: "potty_training", icon: Star },
];

const trustBadges = [
  { icon: Truck, title: "Delivery Available", subtitle: "Nairobi & surroundings", href: null },
  { icon: ShieldCheck, title: "Quality Assured", subtitle: "All products verified safe", href: null },
  { icon: RefreshCw, title: "Easy Returns", subtitle: "7-day return policy", href: null },
  {
    icon: MessageCircle,
    title: "24/7 Support",
    subtitle: "Chat us on WhatsApp",
    href: "https://wa.me/254712345678?text=Hi%20MiniMingle%2C%20I%20need%20help%20with%20my%20order",
  },
];

const fallbackGrid = Array.from({ length: 28 }, (_, i) => (
  <div key={i} className="w-full h-full flex items-center justify-center">
    <ShoppingBag size={32} className="text-pink-300 opacity-40" />
  </div>
));

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products?limit=20&sort=newest")
      .then((res) => {
        const data = res.data.data || [];
        setProducts(data.slice(0, 8));

        const images: string[] = data
          .map((p: any) => p.featuredImageUrl)
          .filter(Boolean);

        const filled: string[] = [];
        while (filled.length < 28) filled.push(...images);
        setHeroImages(filled.slice(0, 28));
      })
      .finally(() => setLoading(false));
  }, []);

  const gridItems =
    heroImages.length > 0
      ? heroImages.map((src, i) => (
          <div key={i} className="w-full h-full">
            <img src={src} alt="baby product" className="w-full h-full object-cover" />
          </div>
        ))
      : fallbackGrid;

  return (
    <div>
      {/* HERO */}
      <section className="relative w-full" style={{ height: "560px", overflow: "hidden" }}>
        <div className="absolute inset-0 z-0">
          <GridMotion items={gridItems} gradientColor="rgba(15, 5, 10, 0.85)" />
        </div>
        <div
          className="absolute inset-0 z-10"
          style={{ background: "radial-gradient(ellipse at center, rgba(10,3,8,0.55) 0%, rgba(10,3,8,0.88) 100%)" }}
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6 gap-6">
          
          {/* Badge */}
          <span className="inline-block bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-semibold px-4 py-1.5 rounded-full tracking-widest uppercase">
            Kenya's Baby Store
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl">
            Everything Your <span className="text-pink-400">Baby</span> Needs
          </h1>

          {/* Single CTA */}
          <Link
            href="/products"
            className="px-10 py-4 rounded-full bg-pink-500 text-white font-bold text-lg hover:bg-pink-600 transition-colors shadow-lg"
          >
            Shop Now
          </Link>

        </div>
      </section>

      {/* MILESTONES */}
      <section className="py-10 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-5 text-center">Shop By Milestone</h2>
          <div className="flex gap-3 flex-wrap justify-center">
            {milestones.map((m) => {
              const Icon = m.icon;
              return (
                <Link key={m.value} href={`/products?milestone=${m.value}`}
                  className="flex items-center gap-2 bg-pink-50 text-pink-700 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-pink-100 hover:shadow-sm transition-all border border-pink-200">
                  <Icon size={14} />
                  {m.label}
                  <ChevronRight size={13} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
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
              {[...Array(4)].map((_, i) => <div key={i} className="bg-slate-200 rounded-2xl aspect-square animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <p className="text-slate-400 text-center py-12">No products yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product: any) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="py-10 px-4 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustBadges.map((badge) => {
            const Icon = badge.icon;
            const content = (
              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl hover:bg-pink-50 transition-colors cursor-pointer">
                <div className="bg-pink-100 p-3 rounded-full"><Icon size={22} className="text-pink-500" /></div>
                <p className="font-semibold text-slate-700 text-sm">{badge.title}</p>
                <p className="text-xs text-slate-400">{badge.subtitle}</p>
              </div>
            );
            return badge.href
              ? <a key={badge.title} href={badge.href} target="_blank" rel="noopener noreferrer">{content}</a>
              : <div key={badge.title}>{content}</div>;
          })}
        </div>
      </section>
    </div>
  );
}