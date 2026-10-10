"use client";
import { useWishlistStore } from "@/store/wishlistStore";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShoppingCart, Heart, ArrowLeft, Baby } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import TrustStrip from "@/components/TrustStrip";
import ProductCard from "@/components/ProductCard";

type ProductVariant = {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  quantity: number;
};

type Product = {
  id: string;
  slug: string;
  category?: { slug: string } | null;
  milestoneTags?: string[];
  variants?: ProductVariant[];
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedProductsError, setRelatedProductsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState("0.0");
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const inWishlist = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProduct(null);
    setRelatedProducts([]);
    setRelatedProductsError(false);

    const loadProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        const currentProduct: Product = res.data;
        if (cancelled) return;
        setProduct(currentProduct);
        setSelectedVariantId(currentProduct.variants?.length === 1 ? currentProduct.variants[0].id : "");
        setLoading(false);

        const params = new URLSearchParams({ limit: "12" });
        if (currentProduct.category?.slug) {
          params.set("category", currentProduct.category.slug);
        } else if (currentProduct.milestoneTags?.[0]) {
          params.set("milestone", currentProduct.milestoneTags[0]);
        }

        if (currentProduct.category?.slug || currentProduct.milestoneTags?.[0]) {
          api.get(`/products?${params.toString()}`)
            .then((relatedRes) => {
              if (!cancelled) {
                setRelatedProducts(
                  (relatedRes.data?.data || [])
                    .filter((candidate: Product) => candidate.id !== currentProduct.id)
                    .slice(0, 4)
                );
              }
            })
            .catch(() => {
              if (!cancelled) setRelatedProductsError(true);
            });
        }

        api.get(`/reviews/product/${currentProduct.id}`)
          .then((reviewRes) => {
            if (!cancelled) {
              setReviews(reviewRes.data.reviews || []);
              setAverageRating(reviewRes.data.averageRating || "0.0");
            }
          })
          .catch(() => {
            if (!cancelled) {
              setReviews([]);
              setAverageRating("0.0");
            }
          });
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProduct();

    return () => { cancelled = true; };
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
  const selectedVariant: ProductVariant | undefined = product.variants?.find(
    (variant: ProductVariant) => variant.id === selectedVariantId
  );
  const productStock = product.variants?.length ? selectedVariant?.quantity || 0 : product.quantity;

  const handleAddToCart = () => {
    if (product.variants?.length && !selectedVariant) {
      return toast.error("Please select a color or size option");
    }
    if (qty > productStock) {
      return toast.error("The selected option does not have enough stock");
    }
    const variantLabel = selectedVariant
      ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(" / ")
      : "";
    addItem({
      id: selectedVariant ? `${product.id}:${selectedVariant.id}` : product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      variantLabel: variantLabel || undefined,
      name: variantLabel ? `${product.name} (${variantLabel})` : product.name,
      price: parseFloat(product.basePrice),
      quantity: qty,
      image: product.featuredImageUrl || "",
      stock: productStock,
    });
    toast.success(`${qty} item(s) added to cart!`);
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!localStorage.getItem("user")) return toast.error("Please sign in to review this product");
    try {
      await api.post("/reviews", { productId: product.id, ...reviewForm });
      setReviewForm({ rating: 5, title: "", body: "" });
      toast.success("Review submitted for approval");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Unable to submit review");
    }
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
            <div className="w-full h-full flex items-center justify-center">
              <Baby size={64} className="text-slate-200" />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{product.name}</h1>
          {product.brand && <p className="text-sm text-slate-500 mb-2">Brand: {product.brand}</p>}

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
            {product.variants?.length > 0 && !selectedVariant
              ? <span className="text-slate-500">Select an option to check availability</span>
              : productStock > 5
              ? <span className="text-green-600 font-medium">✓ In Stock</span>
              : productStock > 0
              ? <span className="text-orange-500 font-medium">⚠ Only {productStock} left!</span>
              : <span className="text-red-500 font-medium">✗ Out of Stock</span>
            }
          </p>

          {product.variants?.length > 0 && (
            <div className="mb-5">
              <label htmlFor="product-variant" className="block text-sm font-medium text-slate-600 mb-2">
                Choose color / size *
              </label>
              <select
                id="product-variant"
                value={selectedVariantId}
                onChange={(event) => {
                  setSelectedVariantId(event.target.value);
                  setQty(1);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <option value="">Select an option</option>
                {product.variants.map((variant: ProductVariant) => {
                  const label = [variant.color, variant.size].filter(Boolean).join(" / ");
                  return (
                    <option key={variant.id} value={variant.id} disabled={variant.quantity <= 0}>
                      {label} {variant.quantity > 0 ? `(${variant.quantity} in stock)` : "(Out of stock)"}
                    </option>
                  );
                })}
              </select>
              {selectedVariant && <p className="mt-1 text-xs text-slate-500">SKU: {selectedVariant.sku}</p>}
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm font-medium text-slate-600">Quantity:</span>
            <div className="flex items-center border border-slate-200 rounded-full overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-lg">−</button>
              <span className="px-4 py-2 text-sm font-medium">{qty}</span>
              <button onClick={() => setQty(Math.min(productStock, qty + 1))}
                className="px-4 py-2 text-slate-600 hover:bg-slate-50 text-lg">+</button>
            </div>
          </div>

          {(relatedProducts.length > 0 || relatedProductsError) && (
            <section className="mt-12 border-t border-slate-100 pt-8">
              <h2 className="text-xl font-bold text-slate-800 mb-5">You may also like</h2>
              {relatedProductsError ? (
                <p className="text-sm text-slate-500">Related products could not be loaded right now.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {relatedProducts.map((relatedProduct) => (
                    <ProductCard key={relatedProduct.id} product={relatedProduct} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={productStock === 0 || (product.variants?.length > 0 && !selectedVariant)}
              className="flex-1 flex items-center justify-center gap-2 bg-pink-600 text-white py-3 rounded-full font-medium hover:bg-pink-700 transition-colors disabled:opacity-50">
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <button
              onClick={() => {
                toggleItem({
                  id: product.id,
                  name: product.name,
                  price: parseFloat(product.basePrice),
                  image: product.featuredImageUrl || "",
                  slug: product.slug,
                  hasVariants: product.variants?.length > 0,
                });
                if (localStorage.getItem("user")) {
                  const request = inWishlist ? api.delete(`/wishlist/${product.id}`) : api.post("/wishlist", { productId: product.id });
                  request.catch(() => toast.error("Could not sync wishlist"));
                }
                toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist!");
              }}
              className={`p-3 border rounded-full transition-colors ${
                inWishlist
                  ? "bg-pink-50 border-pink-300"
                  : "border-slate-200 hover:bg-pink-50 hover:border-pink-300"
              }`}>
              <Heart size={18} className={inWishlist ? "text-pink-500 fill-pink-500" : "text-slate-400"} />
            </button>
          </div>

          <TrustStrip productName={product.name} />
        </div>
      </div>

      <section className="mt-10 border-t border-slate-100 pt-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-800">Customer reviews</h2>
          <span className="text-sm text-amber-600">★ {averageRating} ({reviews.length})</span>
        </div>
        <div className="space-y-3 mb-6">
          {reviews.length === 0 ? <p className="text-sm text-slate-400">No approved reviews yet.</p> : reviews.map((review) => <article key={review.id} className="bg-white border border-slate-100 rounded-xl p-4"><p className="text-amber-500">{"★".repeat(review.rating)}<span className="text-slate-200">{"★".repeat(5 - review.rating)}</span></p><p className="font-medium text-slate-700 text-sm">{review.title || "Verified customer review"}</p><p className="text-sm text-slate-500 mt-1">{review.body}</p></article>)}
        </div>
        <form onSubmit={submitReview} className="bg-slate-50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-slate-700 text-sm">Share your experience</h3>
          <select value={reviewForm.rating} onChange={(event) => setReviewForm({ ...reviewForm, rating: Number(event.target.value) })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"><option value={5}>5 stars</option><option value={4}>4 stars</option><option value={3}>3 stars</option><option value={2}>2 stars</option><option value={1}>1 star</option></select>
          <input value={reviewForm.title} onChange={(event) => setReviewForm({ ...reviewForm, title: event.target.value })} placeholder="Review title" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <textarea required value={reviewForm.body} onChange={(event) => setReviewForm({ ...reviewForm, body: event.target.value })} placeholder="What did you think?" rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          <button className="bg-pink-600 text-white rounded-full px-5 py-2 text-sm font-medium">Submit review</button>
        </form>
      </section>
    </div>
  );
}