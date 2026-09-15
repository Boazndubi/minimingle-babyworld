"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Search, Package } from "lucide-react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [milestone, setMilestone] = useState(searchParams.get("milestone") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sort) params.set("sort", sort);
    if (milestone) params.set("milestone", milestone);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (inStock) params.set("inStock", "true");
    params.set("limit", "24");

    api.get(`/products?${params.toString()}`)
      .then((res) => { if (!cancelled) { setProducts(res.data?.data || []); setLoadError(""); } })
      .catch(() => { if (!cancelled) { setProducts([]); setLoadError("We could not load products right now."); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [debouncedSearch, sort, milestone, category, minPrice, maxPrice, inStock]);

  // Update milestone when URL param changes
  useEffect(() => {
    const m = searchParams.get("milestone") || "";
    const s = searchParams.get("search") || "";
    const c = searchParams.get("category") || "";
    const min = searchParams.get("minPrice") || "";
    const max = searchParams.get("maxPrice") || "";
    const stock = searchParams.get("inStock") === "true";
    setMilestone(m);
    setSearch(s);
    setCategory(c);
    setMinPrice(min);
    setMaxPrice(max);
    setInStock(stock);
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {milestone
          ? `${milestone.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())} Products`
          : "All Products"}
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 w-64 bg-white"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        <select
          value={milestone}
          onChange={(e) => setMilestone(e.target.value)}
          className="border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white">
          <option value="">All Milestones</option>
          <option value="newborn">Newborn</option>
          <option value="expectant_mothers">Expectant Mothers</option>
          <option value="teething">Teething</option>
          <option value="crawling">Crawling</option>
          <option value="walking">Walking</option>
          <option value="potty_training">Potty Training</option>
        </select>

        <>
        <input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min KES" className="w-24 border border-slate-200 rounded-full px-3 py-2 text-sm bg-white" />
        <input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max KES" className="w-24 border border-slate-200 rounded-full px-3 py-2 text-sm bg-white" />
        <label className="flex items-center gap-2 text-sm text-slate-600 px-2"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="accent-pink-600" /> In stock</label>
        {(milestone || search || category || minPrice || maxPrice || inStock) && (
          <button
            onClick={() => { setMilestone(""); setSearch(""); setCategory(""); setMinPrice(""); setMaxPrice(""); setInStock(false); }}
            className="border border-slate-200 rounded-full px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 bg-white">
            Clear filters
          </button>
        )}
        </>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <div className="text-center py-20 text-red-600"><p>{loadError}</p><button onClick={() => window.location.reload()} className="mt-3 text-pink-600 underline">Retry</button></div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-100 p-4 rounded-full">
              <Package size={32} className="text-slate-300" />
            </div>
          </div>
          <p className="font-medium">No products found.</p>
          <p className="text-sm mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}