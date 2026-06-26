import Link from "next/link";
import { SearchX, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="flex justify-center mb-6">
        <div className="bg-slate-100 p-5 rounded-full">
          <SearchX size={40} className="text-slate-400" />
        </div>
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Page Not Found</h1>
      <p className="text-slate-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Link href="/"
        className="inline-flex items-center gap-2 bg-pink-600 text-white px-8 py-3 rounded-full font-medium hover:bg-pink-700 transition-colors">
        <Home size={16} /> Go Home
      </Link>
    </div>
  );
}