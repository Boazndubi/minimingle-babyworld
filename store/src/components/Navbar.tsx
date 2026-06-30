"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Search, Menu, X, Baby } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount());

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">

        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Baby className="text-pink-500" size={22} />
          <span className="font-bold text-pink-600 text-base">MiniMingle</span>
        </Link>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                window.location.href = `/products?search=${search}`;
              }
            }}
            placeholder="Search baby products..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/products"
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors rounded-full hover:bg-pink-50">
            Products
          </Link>
          <Link href="/categories"
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors rounded-full hover:bg-pink-50">
            Categories
          </Link>
          <Link href="/cart"
            className="relative flex items-center gap-1.5 bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-pink-700 transition-colors ml-2">
            <ShoppingCart size={16} />
            <span>Cart</span>
            {mounted && itemCount > 0 && (
              <span className="bg-white text-pink-600 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <Link href="/cart" className="relative p-2 hover:bg-pink-50 rounded-full transition-colors">
            <ShoppingCart size={20} className="text-slate-600" />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 px-4 py-3 flex flex-col gap-3 text-sm font-medium text-slate-600 bg-white">
          <Link href="/products" onClick={() => setMenuOpen(false)} className="hover:text-pink-600">Products</Link>
          <Link href="/categories" onClick={() => setMenuOpen(false)} className="hover:text-pink-600">Categories</Link>
          <Link href="/cart" onClick={() => setMenuOpen(false)} className="hover:text-pink-600">Cart ({mounted ? itemCount : 0})</Link>
        </div>
      )}
    </header>
  );
}