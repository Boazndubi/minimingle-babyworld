"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";

export default function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

  return (
    <Link
      href={isLoggedIn ? "/account" : "/login"}
      className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-pink-600 transition-colors">
      <User size={16} />
      {isLoggedIn ? "Account" : "Login"}
    </Link>
  );
}