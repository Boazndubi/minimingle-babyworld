"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { XCircle, Home, MessageCircle, RefreshCw } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import api from "@/lib/api";
import { whatsappLink } from "@/config/site";
import toast from "react-hot-toast";

type TrackedOrder = {
  paymentStatus: string;
  mpesaAttemptStatus: string | null;
  items?: {
    variantId: string | null;
    variantLabel: string | null;
    quantity: number;
    product?: {
      id: string;
      name: string;
      basePrice: number | string;
      featuredImageUrl: string | null;
      quantity: number;
      variants?: { id: string; quantity: number }[];
    };
  }[];
};

function OrderFailedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const [retrying, setRetrying] = useState(false);
  const [phone, setPhone] = useState("");

  const retryPayment = async () => {
    if (!orderNumber) return router.push("/checkout");
    setRetrying(true);
    try {
      if (!phone.trim()) return toast.error("Enter the phone number used for the order");
      const res = await api.get<TrackedOrder>(`/orders/track/${orderNumber}`, { params: { phone: phone.trim() } });
      const order = res.data;
      if (order.paymentStatus === "paid") {
        toast.success("Payment confirmed. You can check your order status.");
        router.push(`/track-order?order=${encodeURIComponent(orderNumber)}`);
        return;
      }

      const paymentFailed = order.paymentStatus === "failed"
        || (order.paymentStatus === "pending" && order.mpesaAttemptStatus === "failed");
      if (!paymentFailed) {
        toast.error("Payment may still be processing. Check your order status before trying again.");
        return;
      }

      order.items?.forEach((item) => {
        if (item.product) {
          addItem({
            id: item.variantId ? `${item.product.id}:${item.variantId}` : item.product.id,
            productId: item.product.id,
            variantId: item.variantId || undefined,
            variantLabel: item.variantLabel || undefined,
            name: item.variantLabel ? `${item.product.name} (${item.variantLabel})` : item.product.name,
            price: Number(item.product.basePrice),
            quantity: item.quantity,
            image: item.product.featuredImageUrl || "",
            stock: item.variantId
              ? item.product.variants?.find((variant) => variant.id === item.variantId)?.quantity || 0
              : item.product.quantity,
          });
        }
      });
      router.push("/checkout");
    } catch {
      toast.error("We couldn't verify the payment. Check your order status or contact us before trying again.");
    } finally {
      setRetrying(false);
    }
  };

  const trackingUrl = orderNumber
    ? `/track-order?order=${encodeURIComponent(orderNumber)}`
    : "/track-order";
  const supportMessage = orderNumber
    ? `Hi, I need help checking payment for order ${orderNumber}.`
    : "Hi, I need help checking a payment.";

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-red-100 p-5 rounded-full">
          <XCircle size={48} className="text-red-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Not Confirmed</h1>
      <p className="text-slate-500 mb-3">
        We couldn&apos;t confirm your payment yet. It may still be processing.
      </p>
      <p className="text-slate-500 text-sm mb-6">
        Check your M-Pesa or card account and order status before trying again, to avoid paying twice.
      </p>
      {orderNumber && (
        <div className="bg-slate-50 rounded-xl p-4 mb-6 inline-block">
          <p className="text-xs text-slate-400 mb-1">Order reference</p>
          <p className="font-mono font-bold text-slate-800">{orderNumber}</p>
        </div>
      )}
      {orderNumber && (
        <label className="block text-left text-sm text-slate-600 max-w-xs mx-auto mb-5">
          Phone used for the order
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="e.g. 0712 345 678"
            className="block w-full border border-slate-200 rounded-full px-4 py-2.5 text-sm mt-1"
          />
        </label>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderNumber && (
          <Link href={trackingUrl}
            className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-6 py-3 rounded-full font-medium hover:bg-slate-50 transition-colors text-sm">
            Check Order Status
          </Link>
        )}
        <button onClick={retryPayment} disabled={retrying}
          className="flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors text-sm">
          <RefreshCw size={16} className={retrying ? "animate-spin" : ""} /> {retrying ? "Checking payment..." : "Try Again"}
        </button>
        <a href={whatsappLink(supportMessage)} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 border border-green-200 text-green-700 px-6 py-3 rounded-full font-medium hover:bg-green-50 transition-colors text-sm">
          <MessageCircle size={16} /> Contact Support
        </a>
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