"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShoppingCart, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    api.get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-100 rounded-2xl aspect-square" />
        <div className="space-y-4">
          <div className="h-8 bg-slate-100 rounded w-3/4" />
          <div className="h-6 bg-slate-100 rounded w-1/4" />
          <div className="h-24 bg-slate-100 rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20 text-slate-400">Product not found.</div>
  );

  const hasDiscount = product.compareAtPrice &&
    parseFloat(product.compareAtPrice) > parseFloat(product.basePrice);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.basePrice),
      quantity: qty,
      image: product.featuredImageUrl || "",
    });
    toast.success(`${qty} item(s) added to cart!`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/products" className="flex items-center gap-1 text-sm text-slate-500 hover:text-pink-600 mb-6">
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-slate-50 rounded-2xl overflow-hidden aspect-square">
          {product.featuredImageUrl ? (
            <img src={product.featuredImageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">👶</div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{product.name}</h1>

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-pink-600">
              KES {Number(product.basePrice).toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-slate-400 text-lg line-through">
                KES {Number(product.compareAtPrice).toLocaleString()}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-slate-600 text-sm leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Milestone tags */}
          {product.milestoneTags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {product.milestoneTags.map((tag: string) => (
                <span key={tag} className="bg-pink-50 text-pink-600 text-xs px-3 py-1 rounded-full capitalize border border-pink-200">
                  {tag.replace("_", " ")}
                </span>
              ))}
            </div>
          )}

          {/* Stock */}
          <p className="text-sm mb-4">
            {product.quantity > 5
              ? <span className="text-green-600 font-medium">✓ In Stock ({product.quantity} available)</span>
              : product.quantity > 0
              ? <span className="text-orange-500 font-medium">⚠ Only {product.quantity} left!</span>
              : <span className="text-red-500 font-medium">✗ Out of Stock</span>
            }
          </p>

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm font-medium text-slate-600">Quantity:</span>
            <div className="flex items-center border border-slate-200 rounded-full overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-lg">−</button>
              <span className="px-4 py-2 text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(product.quantity, qty + 1))}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-lg">+</button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.quantity === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-pink-600 text-white py-3 rounded-full font-medium hover:bg-pink-700 transition-colors disabled:opacity-50">
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <button className="p-3 border border-slate-200 rounded-full hover:bg-pink-50 hover:border-pink-300 transition-colors">
              <Heart size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}