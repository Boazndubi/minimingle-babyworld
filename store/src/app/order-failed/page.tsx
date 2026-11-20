"use client";
import axios from "axios";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { XCircle, Home, MessageCircle, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { whatsappLink } from "@/config/site";
import toast from "react-hot-toast";

type TrackedOrder = {
  id: string;
  orderNumber: string;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentRef: string | null;
  mpesaCheckoutRequestId: string | null;
  mpesaAttemptStatus: string | null;
  retryAfterSeconds?: number;
  shippingAddress?: { name?: string; email?: string } | null;
};

type RetryableCardOrder = Pick<TrackedOrder, "id" | "orderNumber" | "shippingAddress">;
type PaymentStatusResult = Pick<TrackedOrder, "paymentStatus"> & Partial<Pick<TrackedOrder, "mpesaAttemptStatus">> & {
  retryAfterSeconds?: number;
};

function OrderFailedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [phone, setPhone] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const initiateCardPayment = async (order: RetryableCardOrder) => {
    const nameParts = String(order.shippingAddress?.name || "Customer").trim().split(/\s+/);
    const paymentRes = await api.post<{ redirectUrl: string }>("/pesapal/initiate", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      phone: phone.trim(),
      email: order.shippingAddress?.email || "",
      firstName: nameParts[0] || "Customer",
      lastName: nameParts.slice(1).join(" "),
    });
    if (!paymentRes.data.redirectUrl) throw new Error("Payment provider did not return a checkout link.");
    window.location.assign(paymentRes.data.redirectUrl);
  };

  const checkPaymentStatus = async () => {
    if (!orderNumber) return;
    if (!phone.trim()) return toast.error("Enter the phone number used for the order");
    setChecking(true);
    setPaymentMessage("");

    try {
      const tracked = await api.get<TrackedOrder>(
        `/orders/track/${encodeURIComponent(orderNumber)}`,
        { params: { phone: phone.trim() } }
      );
      let order = tracked.data;

      if (order.paymentStatus === "pending") {
        if (order.paymentMethod === "mpesa" && order.mpesaCheckoutRequestId) {
          const status = await api.post<PaymentStatusResult>("/mpesa/query", {
            orderId: order.id,
            orderNumber: order.orderNumber,
          });
          order = { ...order, ...status.data };
        } else if (order.paymentMethod === "card") {
          const status = await api.post<PaymentStatusResult>("/pesapal/query", {
            orderId: order.id,
            orderNumber: order.orderNumber,
            phone: phone.trim(),
          });
          order = { ...order, ...status.data };
        }
      }

      if (order.paymentStatus === "paid") {
        toast.success("Payment received!");
        router.push(`/order-success?order=${encodeURIComponent(order.orderNumber)}`);
        return;
      }

      if (order.paymentStatus === "pending" && order.mpesaAttemptStatus === "failed") {
        setPaymentMessage("The M-Pesa attempt failed. You can retry payment for this order.");
      } else if (order.paymentStatus === "pending") {
        const waitMessage = "Payment is still being processed. Check again shortly before retrying.";
        setPaymentMessage(waitMessage);
        toast(order.retryAfterSeconds ? `Please wait ${order.retryAfterSeconds} seconds before checking again.` : waitMessage);
      } else if (order.paymentStatus === "failed") {
        setPaymentMessage("Payment failure confirmed. You can retry payment for this order.");
      } else {
        setPaymentMessage(`Current payment status: ${order.paymentStatus}.`);
      }
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error) && typeof error.response?.data?.error === "string"
        ? error.response.data.error
        : "";
      const message = apiMessage || "Unable to refresh payment status. Please try again.";
      setPaymentMessage(message);
      toast.error(message);
    } finally {
      setChecking(false);
    }
  };

  const retryPayment = async () => {
    if (!orderNumber) return router.push("/checkout");
    if (!phone.trim()) return toast.error("Enter the phone number used for the order");
    setRetrying(true);
    setPaymentMessage("");
    try {
      const res = await api.get<TrackedOrder>(`/orders/track/${encodeURIComponent(orderNumber)}`, { params: { phone: phone.trim() } });
      const order = res.data;
      if (order.paymentStatus === "paid") {
        toast.success("Payment confirmed. You can check your order status.");
        router.push(`/track-order?order=${encodeURIComponent(orderNumber)}`);
        return;
      }

      if (order.paymentStatus === "pending" && order.paymentMethod === "mpesa" && order.mpesaAttemptStatus === "failed") {
        await api.post("/mpesa/stkpush", {
          phone: phone.trim(),
          orderId: order.id,
          orderNumber: order.orderNumber,
        });
        setPaymentMessage("A new M-Pesa prompt was sent for this order. Approve it on your phone.");

        for (let attempt = 0; attempt < 20; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          const statusRes = await api.get<Pick<TrackedOrder, "paymentStatus" | "mpesaAttemptStatus">>(
            `/mpesa/status/${order.id}`,
            { params: { orderNumber: order.orderNumber } }
          );
          if (statusRes.data.paymentStatus === "paid") {
            toast.success("Payment received!");
            router.push(`/order-success?order=${encodeURIComponent(order.orderNumber)}`);
            return;
          }
          if (statusRes.data.mpesaAttemptStatus === "failed") {
            setPaymentMessage("The M-Pesa prompt was not completed. Check your order status or contact support.");
            return;
          }
        }

        setPaymentMessage("Payment is still awaiting confirmation. Check your order status before trying again.");
        return;
      }

      if (order.paymentStatus === "pending" && order.paymentMethod === "card" && !order.paymentRef) {
        await initiateCardPayment(order);
        return;
      }

      if (order.paymentStatus === "pending") {
        const message = "Payment may still be processing. Check your order status before trying again.";
        setPaymentMessage(message);
        toast.error(message);
        return;
      }

      if (order.paymentStatus !== "failed" || order.paymentMethod !== "card") {
        const message = "This order cannot be retried. Please contact support for help.";
        setPaymentMessage(message);
        toast.error(message);
        return;
      }

      const retryRes = await api.post<RetryableCardOrder>(
        `/orders/retry-payment/${encodeURIComponent(orderNumber)}`,
        { phone: phone.trim() }
      );
      await initiateCardPayment(retryRes.data);
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error) && typeof error.response?.data?.error === "string"
        ? error.response.data.error
        : "";
      const message = apiMessage || "We couldn't safely retry this order. Check its status or contact support before trying again.";
      setPaymentMessage(message);
      toast.error(message);
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
      {paymentMessage && (
        <p role="status" className="text-sm text-slate-600 mb-5">{paymentMessage}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderNumber && (
          <Link href={trackingUrl}
            className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-6 py-3 rounded-full font-medium hover:bg-slate-50 transition-colors text-sm">
            Check Order Status
          </Link>
        )}
        {orderNumber && (
          <button onClick={checkPaymentStatus} disabled={checking || retrying}
            className="flex items-center justify-center gap-2 border border-slate-200 text-slate-600 px-6 py-3 rounded-full font-medium hover:bg-slate-50 transition-colors text-sm">
            <RefreshCw size={16} className={checking ? "animate-spin" : ""} /> {checking ? "Checking..." : "Check Payment Again"}
          </button>
        )}
        <button onClick={retryPayment} disabled={retrying || checking}
          className="flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors text-sm">
          <RefreshCw size={16} className={retrying ? "animate-spin" : ""} /> {retrying ? "Retrying payment..." : "Retry Payment"}
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