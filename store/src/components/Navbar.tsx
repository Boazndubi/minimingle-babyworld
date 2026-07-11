"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Search, Baby, Menu, X, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);

  const cartCount = cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setUserName(user.firstName || "Account");
      } catch {}
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Baby size={24} className="text-pink-500" />
          <span className="text-lg font-bold text-pink-600">Aroma Line</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:flex">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search baby products..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:bg-white transition-all"
            />
          </div>
        </form>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5 ml-auto">
          <Link href="/products" className="text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
            Products
          </Link>
          <Link href="/categories" className="text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
            Categories
          </Link>
          <Link href="/track-order" className="text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
            Track Order
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto md:ml-4">

          {/* Login / Account */}
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
            <User size={16} />
            {isLoggedIn ? userName : "Login"}
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist" className="relative p-2 text-slate-500 hover:text-pink-500 transition-colors">
            <Heart size={22} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-pink-700 transition-colors">
            <ShoppingCart size={16} />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bg-white text-pink-600 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-slate-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-4">
          <form onSubmit={handleSearch} className="flex sm:hidden">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search baby products..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-100 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </form>
          <Link href="/products" onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-700 hover:text-pink-600">Products</Link>
          <Link href="/categories" onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-700 hover:text-pink-600">Categories</Link>
          <Link href="/track-order" onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-700 hover:text-pink-600">Track Order</Link>
          <Link href={isLoggedIn ? "/account" : "/login"} onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-700 hover:text-pink-600">
            {isLoggedIn ? `My Account (${userName})` : "Login / Register"}
          </Link>
        </div>
      )}
    </header>
  );
}