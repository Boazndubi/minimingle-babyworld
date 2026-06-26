"use client";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { Trash2, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCartStore();

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingBag size={48} className="text-slate-200 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-slate-600 mb-2">Your cart is empty</h2>
      <p className="text-slate-400 mb-6 text-sm">Add some products to get started!</p>
      <Link href="/products"
        className="bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors">
        Shop Now
      </Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0">
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">👶</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 text-sm truncate">{item.name}</p>
                <p className="text-pink-600 font-bold text-sm">KES {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 rounded-full overflow-hidden text-sm">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)}
                    className="px-3 py-1 hover:bg-slate-50">−</button>
                  <span className="px-3 py-1">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="px-3 py-1 hover:bg-slate-50">+</button>
                </div>
                <button onClick={() => removeItem(item.id)}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 h-fit">
          <h3 className="font-semibold text-slate-700 mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>KES {total().toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-800">
              <span>Total</span>
              <span>KES {total().toLocaleString()}</span>
            </div>
          </div>
          <Link href="/checkout"
            className="block w-full bg-pink-600 text-white text-center py-3 rounded-full font-medium hover:bg-pink-700 transition-colors text-sm">
            Proceed to Checkout
          </Link>
          <button onClick={clearCart}
            className="w-full mt-2 text-slate-400 text-xs hover:text-red-400 transition-colors">
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}