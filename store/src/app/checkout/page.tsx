"use client";
import axios from "axios";
import { useState, useMemo, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Phone, MapPin, ShoppingBag, CreditCard, ExternalLink, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import WhatsAppOrderButton from "@/components/WhatsAppOrderButton";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [paymentTimedOut, setPaymentTimedOut] = useState(false);
  const [resendingMpesa, setResendingMpesa] = useState(false);
  const [mpesaRetryTitle, setMpesaRetryTitle] = useState("M-Pesa prompt timed out");
  const [mpesaRetryMessage, setMpesaRetryMessage] = useState("");
  const [activeMpesaOrder, setActiveMpesaOrder] = useState<{ id: string; orderNumber: string } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa");
  const [cardStep, setCardStep] = useState<"form" | "processing" | "redirecting">("form");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; name: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

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
  const [shippingFee, setShippingFee] = useState(500);
const [deliveryZones, setDeliveryZones] = useState<{ city: string; fee: number }[]>([]);

useEffect(() => {
  api.get("/orders/delivery-zones").then((res) => setDeliveryZones(res.data)).catch(() => {});
}, []);

useEffect(() => {
  const key = form.city.trim().toLowerCase();
  const match = deliveryZones.find((z) => z.city === key);
  const fallback = deliveryZones.find((z) => z.city === "default");
  setShippingFee(match ? Number(match.fee) : fallback ? Number(fallback.fee) : 500);
}, [form.city, deliveryZones]);
  const finalTotal = Math.max(0, orderTotal - (appliedCoupon?.discount || 0) + shippingFee);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Auto-fill from logged in user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
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
    setAuthResolved(true);

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

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return toast.error("Enter a promo code");
    setCouponLoading(true);
    try {
      const res = await api.post("/promotions/validate", {
        couponCode: code,
        subtotal: orderTotal,
        productIds: items.map((item) => item.id),
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      });
      setAppliedCoupon({ code: res.data.promo.couponCode, discount: Number(res.data.discount), name: res.data.promo.name });
      setCouponCode(res.data.promo.couponCode);
      toast.success("Promo code applied");
    } catch (err: any) {
      setAppliedCoupon(null);
      toast.error(err.response?.data?.error || "Unable to apply promo code");
    } finally {
      setCouponLoading(false);
    }
  };

  const pollPaymentStatus = (orderId: string, orderNumber: string) => {
    let attempts = 0;
    const maxAttempts = 20;
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/mpesa/status/${orderId}`, { params: { orderNumber } });
        if (!isMountedRef.current) return;
        if (res.data.paymentStatus === "paid") {
          stopPolling();
          setWaitingForPayment(false);
          setPaymentTimedOut(false);
          setActiveMpesaOrder(null);
          clearCart();
          toast.success("Payment received!");
          router.push(`/order-success?order=${orderNumber}`);
          return;
        } else if (res.data.mpesaAttemptStatus === "failed") {
          stopPolling();
          setWaitingForPayment(false);
          setLoading(false);
          setMpesaRetryTitle("M-Pesa prompt not completed");
          setMpesaRetryMessage(res.data.mpesaAttemptMessage || "The M-Pesa request was not completed.");
          setPaymentTimedOut(true);
          return;
        } else if (res.data.paymentStatus === "failed") {
          stopPolling();
          setWaitingForPayment(false);
          setLoading(false);
          setActiveMpesaOrder(null);
          toast.error("Payment failed or was cancelled.");
          return;
        }

        // Safaricom blocks bursty status checks; query at most every 30 seconds.
        if (attempts >= 10 && (attempts - 10) % 10 === 0) {
          try {
            const queryRes = await api.post("/mpesa/query", { orderId, orderNumber });
            if (!isMountedRef.current) return;
            if (queryRes.data.paymentStatus === "paid") {
              stopPolling();
              setWaitingForPayment(false);
              setPaymentTimedOut(false);
              setActiveMpesaOrder(null);
              clearCart();
              toast.success("Payment received!");
              router.push(`/order-success?order=${orderNumber}`);
              return;
            }
            if (queryRes.data.mpesaAttemptStatus === "failed") {
              stopPolling();
              setWaitingForPayment(false);
              setLoading(false);
              setMpesaRetryTitle("M-Pesa prompt not completed");
              setMpesaRetryMessage(queryRes.data.mpesaAttemptMessage || "The M-Pesa request was not completed.");
              setPaymentTimedOut(true);
              return;
            }
          } catch {}
        }
      } catch {}
      if (attempts >= maxAttempts) {
        stopPolling();
        if (isMountedRef.current) {
          setWaitingForPayment(false);
          setLoading(false);
          setMpesaRetryTitle("M-Pesa prompt timed out");
          setMpesaRetryMessage("No payment confirmation arrived within 60 seconds. If you did not receive the prompt or it expired, resend it below.");
          setPaymentTimedOut(true);
          toast.error("Payment timed out.");
        }
      }
    }, 3000);
  };

  const sendMpesaPrompt = async (order: { id: string; orderNumber: string }, isRetry = false) => {
    setLoading(true);
    setWaitingForPayment(false);
    setPaymentTimedOut(false);
    setMpesaRetryTitle("Unable to send M-Pesa prompt");
    setMpesaRetryMessage("");
    if (isRetry) setResendingMpesa(true);

    try {
      await api.post("/mpesa/stkpush", {
        phone: form.phone,
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
      toast.success("Check your phone for the M-Pesa prompt");
      setWaitingForPayment(true);
      pollPaymentStatus(order.id, order.orderNumber);
    } catch (err: unknown) {
      setLoading(false);
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        try {
          const status = await api.get(`/mpesa/status/${order.id}`, {
            params: { orderNumber: order.orderNumber },
          });
          if (status.data.paymentStatus === "paid") {
            setPaymentTimedOut(false);
            setActiveMpesaOrder(null);
            clearCart();
            toast.success("Payment received!");
            router.push(`/order-success?order=${order.orderNumber}`);
            return;
          }
        } catch {}
      }
      setMpesaRetryTitle(isRetry ? "Unable to resend M-Pesa prompt" : "Unable to send M-Pesa prompt");
      const message = axios.isAxiosError(err) && typeof err.response?.data?.error === "string"
        ? err.response.data.error
        : "Unable to send the M-Pesa prompt.";
      setMpesaRetryMessage(message);
      setPaymentTimedOut(true);
    } finally {
      if (isRetry) setResendingMpesa(false);
    }
  };

  const resendMpesaPrompt = () => {
    if (activeMpesaOrder && !resendingMpesa) {
      void sendMpesaPrompt(activeMpesaOrder, true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Your cart is empty");
    if (!form.firstName.trim() || !form.lastName.trim()) return toast.error("Please enter your full name");
    if (!form.phone.trim()) return toast.error("Please enter your phone number");
    if (!form.email.trim()) return toast.error("Please enter your email");

    setLoading(true);

    try {
      const orderItems = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const res = await api.post("/orders", {
        items: orderItems,
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
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
        const pendingOrder = { id: order.id, orderNumber: order.orderNumber };
        setActiveMpesaOrder(pendingOrder);
        await sendMpesaPrompt(pendingOrder);
      } else if (paymentMethod === "card") {
        setCardStep("processing");
        try {
          const pesapalRes = await api.post("/pesapal/initiate", {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: Math.round(Number(order.grandTotal)),
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

  if (!authResolved || !isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center">
          <User size={32} className="text-pink-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            {authResolved ? "Create an account to continue" : "Preparing checkout..."}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {authResolved
              ? "Sign up or log in before checkout. Your cart will be saved while you create or access your account."
              : "Please wait while we check your account."}
          </p>
          {authResolved && (
            <>
              <p className="text-sm text-slate-600 mb-6">
                {items.length} {items.length === 1 ? "item" : "items"} in your cart · KES {orderTotal.toLocaleString()}
              </p>
              <div className="space-y-3">
                <Link
                  href="/register?redirect=%2Fcheckout"
                  className="block w-full bg-pink-600 text-white rounded-full py-3 text-sm font-medium hover:bg-pink-700 transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  href="/login?redirect=%2Fcheckout"
                  className="block w-full border border-slate-200 text-slate-700 rounded-full py-3 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  I already have an account — Sign In
                </Link>
                <Link href="/cart" className="inline-block text-sm text-slate-500 hover:text-pink-600 pt-2">
                  Return to cart
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Checkout</h1>

      {/* M-Pesa Waiting Modal */}
      <AnimatePresence>
        {(waitingForPayment || paymentTimedOut) && (
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
              <h3 className="font-semibold text-slate-800 mb-2">
                {paymentTimedOut ? mpesaRetryTitle : "Check Your Phone"}
              </h3>
              <p className="text-sm text-slate-500">
                {paymentTimedOut
                  ? mpesaRetryMessage
                  : <>An M-Pesa payment request has been sent to <span className="font-medium">{form.phone}</span>. Enter your PIN to complete payment.</>}
              </p>
              {waitingForPayment ? (
                <div className="mt-6 flex justify-center">
                  <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={resendMpesaPrompt}
                    disabled={!activeMpesaOrder || resendingMpesa}
                    className="w-full rounded-full bg-green-600 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {resendingMpesa ? "Sending prompt..." : "Resend M-Pesa prompt"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/cart")}
                    className="text-sm text-slate-500 hover:text-pink-600"
                  >
                    Return to cart
                  </button>
                </div>
              )}
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
                    Email *
                  </label>
                  <input name="email" type="email" required
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
                    </p>
                    <p className="text-xs text-slate-400">Pay via M-Pesa STK push to your phone</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                }`}>
                  <input type="radio" name="payment" value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="text-blue-600" />
                  <div>
                    <p className={`font-medium text-sm ${paymentMethod === "card" ? "text-blue-700" : "text-slate-700"}`}>
                      Card Payment
                    </p>
                    <p className="text-xs text-slate-400">Visa, Mastercard — via Pesapal's secure page</p>
                  </div>
                </label>
              </div>

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
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-center">
                        <p className="text-sm font-medium text-slate-700">Pay by card on Pesapal's secure page</p>
                        <p className="text-xs text-slate-500 mt-1">Visa and Mastercard accepted. You'll be redirected to Pesapal after you click Pay.</p>
                      </div>

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
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); if (appliedCoupon) setAppliedCoupon(null); }}
                    placeholder="Promo code"
                    aria-label="Promo code"
                    className="min-w-0 flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <button type="button" onClick={applyCoupon} disabled={couponLoading}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-medium disabled:opacity-50">
                    {couponLoading ? "Checking..." : "Apply"}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>{appliedCoupon.name}</span>
                    <span>-KES {appliedCoupon.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>KES {orderTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>KES {shippingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 text-base pt-1">
                  <span>Total</span>
                  <span>KES {finalTotal.toLocaleString()}</span>
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
                    : `Pay KES ${finalTotal.toLocaleString()}`}
              </button>
              <WhatsAppOrderButton className="mt-3" />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}