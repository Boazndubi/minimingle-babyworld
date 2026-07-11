"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Package, LogOut, User, Phone, Mail, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));

    api.get("/orders/my")
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-3">
                <span className="text-pink-600 text-xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <h2 className="font-bold text-slate-800">{user.firstName} {user.lastName}</h2>
              <span className="text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full mt-1">Customer</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} className="text-pink-400 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-pink-400 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="w-full mt-6 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 rounded-full py-2 text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* Orders */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Package size={16} className="text-pink-500" />
              My Orders
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No orders yet</p>
                <Link href="/products"
                  className="inline-block mt-3 text-pink-600 text-sm font-medium hover:underline">
                  Start Shopping →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-pink-50 transition-colors">
                    <div>
                      <p className="font-mono text-xs text-slate-500 mb-1">{order.orderNumber}</p>
                      <p className="font-medium text-slate-800 text-sm">
                        KES {Number(order.grandTotal).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-KE", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || "bg-slate-100 text-slate-500"}`}>
                        {order.status}
                      </span>
                      <Link href={`/track-order?order=${order.orderNumber}`}>
                        <ChevronRight size={16} className="text-slate-400" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}