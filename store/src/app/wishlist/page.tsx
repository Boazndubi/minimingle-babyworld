"use client";
import Link from "next/link";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { Heart, ShoppingCart, Trash2, Baby } from "lucide-react";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Heart size={48} className="text-slate-200 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-600 mb-2">Your wishlist is empty</h2>
      <p className="text-slate-400 mb-6 text-sm">Save items you love to find them easily later!</p>
      <Link href="/products"
        className="bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors">
        Browse Products
      </Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Wishlist</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden group">
            <Link href={`/products/${item.slug}`} className="block relative aspect-square bg-slate-50">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Baby size={40} className="text-slate-200" />
                </div>
              )}
            </Link>
            <div className="p-3">
              <Link href={`/products/${item.slug}`}>
                <p className="text-sm font-medium text-slate-700 line-clamp-2 mb-1">{item.name}</p>
              </Link>
              <p className="text-pink-600 font-bold text-sm mb-3">
                KES {item.price.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    addToCart({ id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image });
                    toast.success("Added to cart!");
                  }}
                  className="flex-1 flex items-center justify-center gap-1 bg-pink-600 text-white py-2 rounded-full text-xs font-medium hover:bg-pink-700 transition-colors"
                >
                  <ShoppingCart size={13} /> Add
                </button>
                <button
                  onClick={() => {
                    removeItem(item.id);
                    toast.success("Removed from wishlist");
                  }}
                  className="p-2 border border-slate-200 rounded-full hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <Trash2 size={13} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}