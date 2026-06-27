"use client";
import Link from "next/link";
import { ShoppingCart, Baby } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

export default function ProductCard({ product }: { product: any }) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.basePrice),
      quantity: 1,
      image: product.featuredImageUrl || "",
    });
    toast.success("Added to cart!");
  };

  const hasDiscount = product.compareAtPrice &&
    parseFloat(product.compareAtPrice) > parseFloat(product.basePrice);
  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(product.basePrice) / parseFloat(product.compareAtPrice)) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`}
      className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {product.featuredImageUrl && !product.featuredImageUrl.includes('localhost') ? (
          <img
            src={product.featuredImageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Baby size={48} className="text-slate-200" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discountPct}%
          </span>
        )}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 bg-pink-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-pink-700 shadow-lg">
          <ShoppingCart size={16} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-slate-700 line-clamp-2 mb-1">{product.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-pink-600 font-bold text-sm">
            KES {Number(product.basePrice).toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-slate-400 text-xs line-through">
              {Number(product.compareAtPrice).toLocaleString()}
            </span>
          )}
        </div>
        {product.milestoneTags?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {product.milestoneTags.slice(0, 2).map((tag: string) => (
              <span key={tag} className="text-xs bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-full capitalize">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}