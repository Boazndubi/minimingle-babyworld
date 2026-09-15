"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { XCircle, Home, RefreshCw } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

function OrderFailedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [retrying, setRetrying] = useState(false);

  const retryPayment = async () => {
    if (!orderNumber) return router.push("/checkout");
    setRetrying(true);
    try {
      const res = await api.get(`/orders/track/${orderNumber}`);
      res.data.items?.forEach((item: any) => {
        if (item.product) {
          addItem({
            id: item.product.id,
            name: item.product.name,
            price: Number(item.product.basePrice),
            quantity: item.quantity,
            image: item.product.featuredImageUrl || "",
            stock: item.product.quantity,
          });
        }
      });
      router.push("/checkout");
    } catch {
      toast.error("We could not restore this order. Please start again from the products page.");
      router.push("/products");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-red-100 p-5 rounded-full">
          <XCircle size={48} className="text-red-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h1>
      <p className="text-slate-500 mb-6">
        Your payment was not completed. No charge was made.
      </p>
      {orderNumber && (
        <div className="bg-slate-50 rounded-xl p-4 mb-6 inline-block">
          <p className="text-xs text-slate-400 mb-1">Order reference</p>
          <p className="font-mono font-bold text-slate-800">{orderNumber}</p>
        </div>
      )}
      <div className="flex gap-3 justify-center">
        <button onClick={retryPayment} disabled={retrying}
          className="flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors text-sm">
          <RefreshCw size={16} className={retrying ? "animate-spin" : ""} /> {retrying ? "Restoring..." : "Try Again"}
        </button>
        <Link href="/"
          className="flex items-center gap-2 border border-slate-200 text-slate-600 px-6 py-3 rounded-full font-medium hover:bg-slate-50 transition-colors text-sm">
          <Home size={16} /> Go Home
        </Link>
      </div>
    </div>
  );
}

export default function OrderFailedPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading...</div>}>
      <OrderFailedContent />
    </Suspense>
  );
}