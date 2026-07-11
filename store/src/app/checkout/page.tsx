"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Phone, MapPin, ShoppingBag, CreditCard, ExternalLink, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

function CreditCard3D({ cardHolder }: { cardHolder: string }) {
  return (
    <div className="w-full max-w-sm mx-auto" style={{ perspective: "1000px" }}>
      <div className="relative w-full aspect-[1.586] rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-purple-900/20" />
        <div className="absolute top-6 left-6 w-12 h-9 rounded-md bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 flex items-center justify-center">
          <div className="w-8 h-5 border border-yellow-700/30 rounded-sm relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-3 border border-yellow-700/30 rounded-sm" />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-yellow-700/30" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-yellow-700/30" />
          </div>
        </div>
        <div className="absolute top-6 right-6 text-white/60 text-xs font-medium tracking-widest uppercase">
          Secure Checkout
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-6">
          <p className="text-white text-xl md:text-2xl font-mono tracking-widest whitespace-nowrap">
            •••• •••• •••• ••••
          </p>
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Card Holder</p>
            <p className="text-white text-sm font-medium uppercase tracking-wider truncate max-w-[180px]">
              {cardHolder || "YOUR NAME"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Provider</p>
            <p className="text-white text-sm font-medium tracking-wider">Pesapal</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa");
  const [cardStep, setCardStep] = useState<"form" | "processing" | "redirecting">("form");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  const orderTotal = useMemo(() => total(), [total]);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Auto-fill from logged in user
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setForm(f => ({
          ...f,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
        }));
      } catch {}
    }

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const pollPaymentStatus = (orderId: string, orderNumber: string) => {
    let attempts = 0;
    const maxAttempts = 30;
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/mpesa/status/${orderId}`);
        if (!isMountedRef.current) return;
        if (res.data.paymentStatus === "paid") {
          stopPolling();
          setWaitingForPayment(false);
          clearCart();
          toast.success("Payment received!");
          router.push(`/order-success?order=${orderNumber}`);
        } else if (res.data.paymentStatus === "failed") {
          stopPolling();
          setWaitingForPayment(false);
          setLoading(false);
          toast.error("Payment failed or was cancelled.");
        }
      } catch {}
      if (attempts >= maxAttempts) {
        stopPolling();
        if (isMountedRef.current) {
          setWaitingForPayment(false);
          setLoading(false);
          toast.error("Payment timed out.");
        }
      }
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Your cart is empty");
    if (!form.firstName.trim() || !form.lastName.trim()) return toast.error("Please enter your full name");
    if (!form.phone.trim()) return toast.error("Please enter your phone number");
    if (paymentMethod === "card" && !form.email.trim()) return toast.error("Email is required for card payment");

    setLoading(true);

    try {
      // Get userId if logged in
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      const userId = token && storedUser ? JSON.parse(storedUser).id : null;

      const orderItems = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const res = await api.post("/orders", {
        items: orderItems,
        paymentMethod,
        userId,
        shippingAddress: {
          name: `${form.firstName} ${form.lastName}`,
          phone: form.phone,
          email: form.email,
          address_line_1: form.address,
          city: form.city,
        },
        notes: form.notes,
      });

      const order = res.data;

      if (paymentMethod === "mpesa") {
        try {
          await api.post("/mpesa/stkpush", {
            phone: form.phone,
            amount: Math.round(orderTotal),
            orderId: order.id,
            orderNumber: order.orderNumber,
          });
          toast.success("Check your phone for M-Pesa prompt");
          setWaitingForPayment(true);
          pollPaymentStatus(order.id, order.orderNumber);
        } catch (mpesaErr: any) {
          setLoading(false);
          toast.error(mpesaErr.response?.data?.error || "M-Pesa prompt failed");
        }
      } else if (paymentMethod === "card") {
        setCardStep("processing");
        try {
          const pesapalRes = await api.post("/pesapal/initiate", {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: Math.round(orderTotal),
            phone: form.phone,
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName,
          });
          setCardStep("redirecting");
          clearCart();
          window.location.href = pesapalRes.data.redirectUrl;
        } catch (cardErr: any) {
          setCardStep("form");
          setLoading(false);
          toast.error(cardErr.response?.data?.error || "Card payment failed");
        }
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err.response?.data?.error || "Failed to place order");
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={48} className="text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-600 mb-2">Your cart is empty</h2>
        <Link href="/products"
          className="bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors inline-block mt-4">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Checkout</h1>

      {/* Login prompt for guests */}
      {!isLoggedIn && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-pink-500" />
            <p className="text-sm text-slate-600">
              Have an account? Login for faster checkout with saved details.
            </p>
          </div>
          <Link href="/login"
            className="text-sm font-medium text-pink-600 hover:underline flex-shrink-0">
            Login →
          </Link>
        </div>
      )}

      {/* M-Pesa Waiting Modal */}
      <AnimatePresence>
        {waitingForPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-green-50 p-4 rounded-full animate-pulse">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Check Your Phone</h3>
              <p className="text-sm text-slate-500">
                An M-Pesa payment request has been sent to{" "}
                <span className="font-medium">{form.phone}</span>.
                Enter your PIN to complete payment.
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Phone size={16} className="text-pink-500" /> Contact Details
                {isLoggedIn && (
                  <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                    Auto-filled
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                  <input required name="firstName" value={form.firstName} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
                  <input required name="lastName" value={form.lastName} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
                  <input required name="phone" value={form.phone} onChange={handleChange}
                    placeholder="0712345678"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Email {paymentMethod === "card" ? "*" : ""}
                  </label>
                  <input name="email" type="email" required={paymentMethod === "card"}
                    value={form.email} onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-pink-500" /> Delivery Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Address *</label>
                  <input required name="address" value={form.address} onChange={handleChange}
                    placeholder="Street, Building, Apartment"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">City *</label>
                  <input required name="city" value={form.city} onChange={handleChange}
                    placeholder="Nairobi"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Order Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange}
                    rows={2} placeholder="Any special instructions..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-pink-500" /> Payment Method
              </h3>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "mpesa" ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300"
                }`}>
                  <input type="radio" name="payment" value="mpesa"
                    checked={paymentMethod === "mpesa"}
                    onChange={() => { setPaymentMethod("mpesa"); setCardStep("form"); }}
                    className="text-green-600" />
                  <div>
                    <p className={`font-medium text-sm ${paymentMethod === "mpesa" ? "text-green-700" : "text-slate-700"}`}>
                      M-Pesa