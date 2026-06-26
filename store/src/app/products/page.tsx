"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Search, SlidersHorizontal } from "lucide-react";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState("newest");
  const [milestone, setMilestone] = useState(searchParams.get("milestone") || "");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    if (milestone) params.set("milestone", milestone);
    params.set("limit", "24");

    api.get(`/products?${params.toString()}`)
      .then((res) => setProducts(res.data.data))
      .finally(() => setLoading(false));
  }, [search, sort, milestone]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">All Products</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-8 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>

        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        <select value={milestone} onChange={(e) => setMilestone(e.target.value)}
          className="border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300">
          <option value="">All Milestones</option>
          <option value="newborn">Newborn</option>
          <option value="teething">Teething</option>
          <option value="crawling">Crawling</option>
          <option value="walking">Walking</option>
          <option value="potty_training">Potty Training</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-4xl mb-3">🍼</p>
          <p>No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}