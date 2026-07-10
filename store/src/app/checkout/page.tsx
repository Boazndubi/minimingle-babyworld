"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Phone, MapPin, ShoppingBag, CreditCard, CheckCircle2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Decorative Card Preview (NOT used to collect real card data) ────────
// This renders a live "you'll see something like this" preview using only
// the cardholder name the person types in the contact section. It never
// captures a real card number / expiry / CVV, and nothing here is ever
// sent to our backend. Actual card entry happens on Pesapal's hosted page.
function CreditCard3D({ cardHolder }: { cardHolder: string }) {
  return (
    <div className="w-full max-w-sm mx-auto" style={{ perspective: "1000px" }}>
      <div className="relative w-full aspect-[1.586] rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-purple-900/20" />

        {/* Card chip */}
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

        {/* Masked placeholder number — always masked, never real */}
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

        <div className="absolute bottom-6 right-6">
          <svg width="48" height="16" viewBox="0 0 48 16" fill="none">
            <path d="M17.5 2L15 14H18.5L21 2H17.5Z" fill="white" fillOpacity="0.9"/>
            <path d="M12 2L8 10L7.5 8C6.5 5 4 3 4 3L7 14H11L16 2H12Z" fill="white" fillOpacity="0.9"/>
            <path d="M26 2C26 2 24 2 23 3L19 14H23L23.5 12.5H28L28.3 14H31.5L28.5 2H26ZM24.5 10L26 5.5L27 10H24.5Z" fill="white" fillOpacity="0.9"/>
            <path d="M36 2L32 14H36L39 2H36Z" fill="white" fillOpacity="0.9"/>
            <path d="M44 2H40L36 14H40L44 2Z" fill="white" fillOpacity="0.9"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Main Checkout Page ──────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa");

  // Card flow step (no card fields — Pesapal collects those on its own page)
  const [cardStep, setCardStep] = useState<"form" | "processing" | "redirecting">("form");

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

  // Track the poll interval + mounted state so we never call setState
  // or navigate after the component has unmounted (e.g. user navigates away
  // while an M-Pesa STK push is still pending).
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
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

    stopPolling(); // guard against double-polling if triggered twice

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/mpesa/status/${orderId}`);
        if (!isMountedRef.current) return; // component gone — bail silently

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
      } catch {
        // transient network error — let it retry on the next tick
      }

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
    setLoading(true);

    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      // NOTE: only send what identifies the order. The backend must look up
      // the order by ID and compute its own total server-side — never trust
      // a client-supplied amount for what gets charged.
      const res = await api.post("/orders", {
        items: orderItems,
        paymentMethod,
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
            orderId: order.id, // amount is looked up server-side from orderId
          });
          toast.success("Check your phone for M-Pesa prompt");
          setWaitingForPayment(true);
          pollPaymentStatus(order.id, order.orderNumber);
        } catch (mpesaErr: any) {
          setLoading(false);
          toast.error(mpesaErr.response?.data?.error || "M-Pesa prompt failed");
        }
      } else if (paymentMethod === "card") {
        // Card flow: we never collect a PAN, expiry, or CVV ourselves.
        // We ask the backend to create a Pesapal hosted-checkout session
        // for this order, then send the browser to Pesapal's own page,
        // where the person enters their card details on Pesapal's
        // PCI-compliant form — not ours.
        setCardStep("processing");
        try {
          const pesapalRes = await api.post("/pesapal/initiate", {
            orderId: order.id,
            orderNumber: order.orderNumber,
            phone: form.phone,
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName,
            // no amount, no card fields — server derives amount from orderId
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
        <Link
          href="/products"
          className="bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors inline-block mt-4"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Checkout</h1>

      {/* M-Pesa Waiting Modal */}
      <AnimatePresence>
        {waitingForPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <div className="flex justify-center mb-4">
                <div className="bg-green-50 p-4 rounded-full animate-pulse">
                  <img src="/mpesa-logo.png" alt="M-Pesa" className="w-8 h-8 object-contain" />
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Check Your Phone</h3>
              <p className="text-sm text-slate-500">
                An M-Pesa payment request has been sent to{" "}
                <span className="font-medium">{form.phone}</span>.
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

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-pink-500" /> Payment Method
              </h3>
              <div className="space-y-3">
                {/* M-Pesa */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "mpesa" ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300"
                }`}>
                  <input type="radio" name="payment" value="mpesa"
                    checked={paymentMethod === "mpesa"}
                    onChange={() => { setPaymentMethod("mpesa"); setCardStep("form"); }}
                    className="text-green-600" />
                  <div className="flex items-center gap-3 flex-1">
                    <img src="/mpesa-logo.png" alt="M-Pesa" className="w-14 h-7 object-contain" />
                    <div>
                      <p className={`font-medium text-sm ${paymentMethod === "mpesa" ? "text-green-700" : "text-slate-700"}`}>M-Pesa</p>
                      <p className="text-xs text-slate-400">Pay via M-Pesa STK push to your phone</p>
                    </div>
                  </div>
                </label>

                {/* Card — hosted redirect */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                }`}>
                  <input type="radio" name="payment" value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="text-blue-600" />
                  <div className="flex items-center gap-3 flex-1">
                    <img src="/visa-mastercard.png" alt="Visa & Mastercard" className="w-16 h-8 object-contain" />
                    <div>
                      <p className={`font-medium text-sm ${paymentMethod === "card" ? "text-blue-700" : "text-slate-700"}`}>Card Payment</p>
                      <p className="text-xs text-slate-400">Visa, Mastercard — via Pesapal's secure page</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* ─── CARD FLOW: preview + hosted-redirect notice ────── */}
              <AnimatePresence>
                {paymentMethod === "card" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <CreditCard3D cardHolder={`${form.firstName} ${form.lastName}`.trim()} />

                      <AnimatePresence mode="wait">
                        {cardStep === "form" && (
                          <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-6 space-y-3 text-center"
                          >
                            <p className="text-sm text-slate-500">
                              You'll enter your card number, expiry, and CVV on Pesapal's
                              secure payment page — we never see or store those details.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              256-bit SSL
                              <span className="mx-1">•</span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                              PCI-DSS Compliant (Pesapal)
                            </div>
                          </motion.div>
                        )}

                        {cardStep === "processing" && (
                          <motion.div
                            key="processing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="mt-8 text-center py-8"
                          >
                            <motion.div
                              animate={{ boxShadow: [
                                "0 0 20px rgba(59, 130, 246, 0.3)",
                                "0 0 40px rgba(59, 130, 246, 0.5)",
                                "0 0 20px rgba(59, 130, 246, 0.3)",
                              ]}}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-4"
                            >
                              <CreditCard size={32} className="text-blue-500" />
                            </motion.div>
                            <h4 className="font-semibold text-slate-700">Creating secure payment session...</h4>
                            <p className="text-sm text-slate-400 mt-1">Please do not close this window</p>
                          </motion.div>
                        )}

                        {cardStep === "redirecting" && (
                          <motion.div
                            key="redirecting"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-8 text-center py-8"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 15 }}
                              className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4"
                            >
                              <ExternalLink size={28} className="text-blue-600" />
                            </motion.div>
                            <h4 className="font-semibold text-slate-700 text-lg">Redirecting to Pesapal...</h4>
                            <p className="text-sm text-slate-400 mt-1">
                              Complete your KES {orderTotal.toLocaleString()} payment on the next page
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right — Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-24">
              <h3 className="font-semibold text-slate-700 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={16} className="text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">x{item.quantity}</p>
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      KES {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>KES {orderTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 text-base pt-1">
                  <span>Total</span>
                  <span>KES {orderTotal.toLocaleString()}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || (paymentMethod === "card" && cardStep !== "form")}
                className="w-full mt-6 bg-pink-600 text-white py-3 rounded-full font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 text-sm"
              >
                {loading
                  ? paymentMethod === "mpesa"
                    ? "Sending M-Pesa Prompt..."
                    : paymentMethod === "card"
                    ? cardStep === "redirecting"
                      ? "Redirecting..."
                      : "Processing..."
                    : "Placing Order..."
                  : `Pay KES ${orderTotal.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}