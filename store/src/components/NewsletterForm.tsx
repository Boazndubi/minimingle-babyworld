"use client";
import { useState } from "react";
import api from "@/lib/api";

// Footer newsletter sign-up. Posts to /api/subscribers.
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: real visitors never see or fill this
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const res = await api.post("/subscribers", { email, website, source: "footer" });
      setStatus("done");
      setMessage(res.data?.message || "Thanks for subscribing!");
      setEmail("");
    } catch (err: unknown) {
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setStatus("error");
      setMessage(apiError || "Couldn't subscribe right now. Please try again.");
    }
  };

  if (status === "done") {
    return <p className="text-xs text-green-400">{message}</p>;
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        {/* Honeypot */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-pink-700 transition-colors flex-shrink-0 disabled:opacity-60"
        >
          {status === "loading" ? "..." : "Join"}
        </button>
      </div>
      {status === "error" && <p className="text-[11px] text-red-400 mt-1.5">{message}</p>}
      <p className="text-[10px] text-slate-500 mt-1.5">
        By joining you agree to get emails from {`MiniMingle`}. Unsubscribe any time.
      </p>
    </form>
  );
}
