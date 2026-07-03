"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { ChevronRight, Truck, ShieldCheck, RefreshCw, MessageCircle } from "lucide-react";

const milestones = [
  { label: "Newborn", value: "newborn", emoji: "👶" },
  { label: "Teething", value: "teething", emoji: "🦷" },
  { label: "Crawling", value: "crawling", emoji: "🐣" },
  { label: "Walking", value: "walking", emoji: "👟" },
  { label: "Potty Training", value: "potty_training", emoji: "🚽" },
];

const trustBadges = [
  {
    icon: Truck,
    title: "Delivery Available",
    subtitle: "Nairobi & surroundings",
    href: null,
  },
  {
    icon: ShieldCheck,
    title: "Quality Assured",
    subtitle: "All products verified safe",
    href: null,
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    subtitle: "7-day return policy",
    href: null,
  },
  {
    icon: MessageCircle,
    title: "24/7 Support",
    subtitle: "Chat us on WhatsApp",
    // Replace with your actual WhatsApp number
    href: "https://wa.me/254712345678?text=Hi%20MiniMingle%2C%20I%20need%20help%20with%20my%20order",
  },
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products?limit=8&sort=newest")
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Left: copy */}
          <div className="text-center md:text-left">
            <span className="inline-block bg-pink-100 text-pink-600 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
              Kenya's Baby Store 🇰🇪
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
              Everything Your{" "}
              <span className="text-pink-600">Baby</span>{" "}
              Needs
            </h1>
            <p className="mt-5 text-lg text-slate-500 max-w-md mx-auto md:mx-0">
              Shop milestone-based baby products curated for every stage of your little one's journey — from first cry to first steps.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
              <Link
                href="/products"
                className="px-7 py-3 rounded-full bg-pink-600 text-white font-semibold shadow-md hover:bg-pink-700 transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/categories"
                className="px-7 py-3 rounded-full border-2 border-pink-500 text-pink-600 font-semibold hover:bg-pink-50 transition-colors"
              >
                Browse Categories
              </Link>
            </div>

            {/* Quick trust pills */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start text-xs text-slate-500">
              <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-pink-400" /> Safety-checked products</span>
              <span className="flex items-center gap-1"><Truck size={13} className="text-pink-400" /> Delivered to your door</span>
              <span className="flex items-center gap-1"><RefreshCw size={13} className="text-pink-400" /> 7-day easy returns</span>
            </div>
          </div>

          {/* Right: video */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5">
              {/*
                REPLACE the src below with your actual Cloudinary video URL after uploading.
                Example: https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/f_auto,q_auto,w_900/hero/baby-crawling.mp4

                POSTER: take a screenshot of the first frame and upload to Cloudinary too.
                Example: https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/f_auto,q_auto/hero/baby-poster.jpg
              */}
              <video
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                poster="/hero-poster.jpg"
              >
                <source src="/hero-baby.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg px-5 py-3 hidden sm:block border border-slate-100">
              <p className="text-xs text-slate-400">Trusted by</p>
              <p className="text-base font-bold text-pink-600">2,000+ parents 🇰🇪</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MILESTONES ── */}
      <section className="py-10 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 mb-5 text-center">Shop By Milestone</h2>
          <div className="flex gap-3 flex-wrap justify-center">
            {milestones.map((m) => (
              <Link
                key={m.value}
                href={`/products?milestone=${m.value}`}
                className="flex items-center gap-2 bg-pink-50 text-pink-700 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-pink-100 hover:shadow-sm transition-all border border-pink-200"
              >
                <span>{m.emoji}</span>
                {m.label}
                <ChevronRight size={13} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ── */}
      <section className="py-12 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Featured Products</h2>
            <Link
              href="/products"
              className="text-pink-600 text-sm font-medium hover:underline flex items-center gap-1"
            >
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

      {/* ── TRUST BADGES (above footer) ── */}
      <section className="py-10 px-4 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {trustBadges.map((badge) => {
            const Icon = badge.icon;
            const content = (
              <div className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl hover:bg-pink-50 transition-colors">
                <div className="bg-pink-100 p-3 rounded-full">
                  <Icon size={22} className="text-pink-500" />
                </div>
                <p className="font-semibold text-slate-700 text-sm">{badge.title}</p>
                <p className="text-xs text-slate-400">{badge.subtitle}</p>
              </div>
            );

            return badge.href ? (
              <a key={badge.title} href={badge.href} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <div key={badge.title}>{content}</div>
            );
          })}
        </div>
      </section>
    </div>
  );
}