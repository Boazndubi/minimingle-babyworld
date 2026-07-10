"use client";
import { useState } from "react";
import api from "@/lib/api";
import { Search, Package, CheckCircle, Truck, Home, Clock, XCircle } from "lucide-react";

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock, description: "Your order has been received" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle, description: "Your order has been confirmed" },
  { key: "processing", label: "Processing", icon: Package, description: "Your items are being prepared" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "Your order is on the way" },
  { key: "delivered", label: "Delivered", icon: Home, description: "Your order has been delivered" },
];

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await api.get(`/orders/track/${orderNumber.trim()}`);
      setOrder(res.data);
    } catch (err: any) {
      setError("Order not found. Please check your order number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = (status: string) => {
    if (status === "cancelled") return -1;
    return statusSteps.findIndex(s => s.key === status);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-pink-50 p-4 rounded-full">
            <Package size={32} className="text-pink-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Track Your Order</h1>
        <p className="text-slate-500 text-sm">Enter your order number to see the current status</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleTrack} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            placeholder="e.g. MMBW-1234567890"
            className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-pink-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-pink-700 transition-colors disabled:opacity-50">
          {loading ? "Searching..." : "Track"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
          <XCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Order Result */}
      {order && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Order Header */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Order Number</p>
                <p className="font-mono font-bold text-slate-800">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">Order Date</p>
                <p className="text-sm font-medium text-slate-700">
                  {new Date(order.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-1">Total</p>
                <p className="text-sm font-bold text-pink-600">KES {Number(order.grandTotal).toLocaleString()}</p>
              </div>
            </div>

            {/* Payment status */}
            <div className="mt-3 flex gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                order.paymentStatus === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                Payment: {order.paymentStatus}
              </span>
              {order.channel === "in_store" && (
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                  In Store Purchase
                </span>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-6">Order Status</h3>

            {order.status === "cancelled" ? (
              <div className="flex items-center gap-3 bg-red-50 rounded-xl p-4">
                <XCircle size={24} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700">Order Cancelled</p>
                  <p className="text-xs text-red-500 mt-0.5">This order has been cancelled</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {statusSteps.map((step, index) => {
                  const currentStep = getCurrentStep(order.status);
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex gap-4 mb-6 last:mb-0">
                      {/* Icon and line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isCompleted
                            ? "bg-pink-600 text-white"
                            : "bg-slate-100 text-slate-300"
                        } ${isCurrent ? "ring-4 ring-pink-100" : ""}`}>
                          <Icon size={18} />
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div className={`w-0.5 h-8 mt-1 transition-colors ${
                            index < currentStep ? "bg-pink-600" : "bg-slate-200"
                          }`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="pt-2">
                        <p className={`text-sm font-medium ${isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                          {step.label}
                          {isCurrent && (
                            <span className="ml-2 text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </p>
                        <p className={`text-xs mt-0.5 ${isCompleted ? "text-slate-500" : "text-slate-300"}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Items Ordered</h3>
            <div className="space-y-3">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0">
                    {item.product?.featuredImageUrl ? (
                      <img src={item.product.featuredImageUrl} alt={item.product?.name}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={16} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {item.product?.name || "Product"}
                    </p>
                    <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    KES {Number(item.unitPrice * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          {order.shippingAddress && (
            <div className="p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Delivery Address</h3>
              <div className="text-sm text-slate-500 space-y-1">
                <p className="font-medium text-slate-700">{order.shippingAddress.name}</p>
                {order.shippingAddress.address_line_1 && <p>{order.shippingAddress.address_line_1}</p>}
                {order.shippingAddress.city && <p>{order.shippingAddress.city}</p>}
                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
