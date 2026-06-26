"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Home } from "lucide-react";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-green-100 p-5 rounded-full">
          <CheckCircle size={48} className="text-green-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Order Placed!</h1>
      <p className="text-slate-500 mb-2">Thank you for shopping with MiniMingleBabyWorld.</p>
      {orderNumber && (
        <div className="bg-slate-50 rounded-xl p-4 mb-6 inline-block">
          <p className="text-xs text-slate-400 mb-1">Your order number</p>
          <p className="font-mono font-bold text-slate-800">{orderNumber}</p>
        </div>
      )}
      <div className="bg-pink-50 rounded-xl p-4 mb-8 text-left">
        <div className="flex items-center gap-2 mb-2">
          <Package size={16} className="text-pink-600" />
          <p className="font-medium text-slate-700 text-sm">What happens next?</p>
        </div>
        <ul className="text-xs text-slate-500 space-y-1 ml-6 list-disc">
          <li>We will confirm your order via SMS or WhatsApp</li>
          <li>Your items will be packed and dispatched within 24 hours</li>
          <li>Estimated delivery: 1-3 business days in Nairobi</li>
        </ul>
      </div>
      <div className="flex gap-3 justify-center">
        <Link href="/"
          className="flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors text-sm">
          <Home size={16} /> Back to Home
        </Link>
        <Link href="/products"
          className="flex items-center gap-2 border border-slate-200 text-slate-600 px-6 py-3 rounded-full font-medium hover:bg-slate-50 transition-colors text-sm">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}