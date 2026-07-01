"use client";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Phone, MapPin, ShoppingBag, CreditCard, Banknote } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const pollPaymentStatus = (orderId: string, orderNumber: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/mpesa/status/${orderId}`);
        if (res.data.paymentStatus === "paid") {
          clearInterval(interval);
          setWaitingForPayment(false);
          clearCart();
          toast.success("Payment received!");
          router.push(`/order-success?order=${orderNumber}`);
        } else if (res.data.paymentStatus === "failed") {
          clearInterval(interval);
          setWaitingForPayment(false);
          setLoading(false);
          toast.error("Payment failed or was cancelled. Please try again.");
        }
      } catch {
        // ignore single poll errors
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setWaitingForPayment(false);
        setLoading(false);
        toast.error("Payment timed out. If you completed it, check your orders shortly.");
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
            amount: total(),
            orderId: order.id,
            orderNumber: order.orderNumber,
          });
          toast.success("Check your phone to complete payment via M-Pesa");
          setWaitingForPayment(true);
          pollPaymentStatus(order.id, order.orderNumber);
        } catch (mpesaErr: any) {
          setLoading(false);
          toast.error(mpesaErr.response?.data?.error || "Failed to send M-Pesa prompt. Please try again.");
        }

      } else if (paymentMethod === "card") {
        try {
          const pesapalRes = await api.post("/pesapal/initiate", {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: total(),
            phone: form.phone,
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName
          });
          window.location.href = pesapalRes.data.redirectUrl;
        } catch (cardErr: any) {
          setLoading(false);
          toast.error(cardErr.response?.data?.error || "Failed to initiate card payment. Please try again.");
        }

      } else {
        clearCart();
        toast.success(`Order ${order.orderNumber} placed successfully!`);
        router.push(`/order-success?order=${order.orderNumber}`);
      }
    } catch (err: any) {
      setLoading(false);
      toast.error(err.response?.data?.error || "Failed to place order");
    }
  };

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingBag size={48} className="text-slate-200 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-600 mb-2">Your cart is empty</h2>
      <Link href="/products"
        className="bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors inline-block mt-4">
        Shop Now
      </Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Checkout</h1>

      {waitingForPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-50 p-4 rounded-full animate-pulse">
                <img src="/mpesa-logo.png" alt="M-Pesa" className="w-8 h-8 object-contain" />
              </div>
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Check Your Phone</h3>
            <p className="text-sm text-slate-500">
              An M-Pesa payment request has been sent to{" "}
              <span className="font-medium">{form.phone}</span>.
              Enter your PIN to complete the payment.
            </p>
            <div className="mt-6 flex justify-center">
              <div className="w-6 h-6 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          </div>
        </div>
      )}

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
                  <input
                    name="email"
                    type="email"
                    required={paymentMethod === "card"}
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
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

            {/* Payment with Logos */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <CreditCard size={16} className="text-pink-500" /> Payment Method
              </h3>
              <div className="space-y-3">
                {/* M-Pesa */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "mpesa" ? "border-green-500 bg-green-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="payment" value="mpesa"
                    checked={paymentMethod === "mpesa"}
                    onChange={() => setPaymentMethod("mpesa")} className="text-green-600" />
                  <div className="flex items-center gap-3 flex-1">
                    <img src="/mpesa-logo.png" alt="M-Pesa" className="w-14 h-7 object-contain" />
                    <div>
                      <p className={`font-medium text-sm ${paymentMethod === "mpesa" ? "text-green-700" : "text-slate-700"}`}>M-Pesa</p>
                      <p className="text-xs text-slate-400">Pay via M-Pesa STK push to your phone</p>
                    </div>
                  </div>
                </label>

                {/* Card */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="payment" value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")} className="text-blue-600" />
                  <div className="flex items-center gap-3 flex-1">
                    <img src="/visa-mastercard.png" alt="Visa & Mastercard" className="w-16 h-8 object-contain" />
                    <div>
                      <p className={`font-medium text-sm ${paymentMethod === "card" ? "text-blue-700" : "text-slate-700"}`}>Card Payment</p>
                      <p className="text-xs text-slate-400">Visa, Mastercard — secure payment via Pesapal</p>
                    </div>
                  </div>
                </label>

                {/* Bank Transfer */}
                <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "bank_transfer" ? "border-pink-500 bg-pink-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="payment" value="bank_transfer"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={() => setPaymentMethod("bank_transfer")} className="text-pink-600" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-14 h-7 flex items-center justify-center bg-slate-100 rounded">
                      <Banknote size={20} className="text-slate-500" />
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${paymentMethod === "bank_transfer" ? "text-pink-700" : "text-slate-700"}`}>Bank Transfer</p>
                      <p className="text-xs text-slate-400">Direct bank transfer — order confirmed on receipt</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right — Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-24">
              <h3 className="font-semibold text-slate-700 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden flex-shrink-0">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={16} className="text-slate-300" />
                          </div>
                      }
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
                  <span>KES {total().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 text-base pt-1">
                  <span>Total</span>
                  <span>KES {total().toLocaleString()}</span>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full mt-6 bg-pink-600 text-white py-3 rounded-full font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 text-sm">
                {loading
                  ? paymentMethod === "mpesa"
                    ? "Sending M-Pesa Prompt..."
                    : paymentMethod === "card"
                    ? "Redirecting to Pesapal..."
                    : "Placing Order..."
                  : `Pay KES ${total().toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}