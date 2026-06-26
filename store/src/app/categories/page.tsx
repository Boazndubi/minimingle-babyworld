"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Tag, ChevronRight } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/categories")
      .then((res) => setCategories(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Categories</h1>
      <p className="text-slate-400 text-sm mb-8">Browse products by category</p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-100 p-4 rounded-full">
              <Tag size={32} className="text-slate-300" />
            </div>
          </div>
          <p className="text-slate-400">No categories yet.</p>
          <p className="text-slate-300 text-sm mt-1">Add categories from the admin dashboard.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {categories.map((cat: any) => (
            <Link key={cat.id} href={`/products?category=${cat.slug}`}
              className="group bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md hover:border-pink-200 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="bg-pink-50 p-2.5 rounded-xl w-fit mb-3 group-hover:bg-pink-100 transition-colors">
                    <Tag size={20} className="text-pink-500" />
                  </div>
                  <p className="font-semibold text-slate-700">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description}</p>
                  )}
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-pink-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}