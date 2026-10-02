"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import wLogo from "@/public/wLogo.png";

/* ================================================================== */
/*  ICONS FROM COLLECTION PAGE                                         */
/* ================================================================== */

const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
    <circle cx="11" cy="11" r="7.5" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const IconBag = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const IconUser = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMenu = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const IconClose = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
    <path d="M6 18 18 6M6 6l12 12" />
  </svg>
);

// 🟢 Exact Logout SVG from CollectionPage
const IconLogout = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14.5 6c-.05-1.1-.19-1.79-.6-2.33a2.9 2.9 0 0 0-.55-.55C12.54 2.5 11.36 2.5 9.01 2.5H8.5C5.68 2.5 4.26 2.5 3.38 3.38 2.5 4.26 2.5 5.67 2.5 8.5v7c0 2.83 0 4.24.88 5.12.88.88 2.3.88 5.12.88h.51c2.35 0 3.53 0 4.34-.62.21-.16.4-.35.55-.55.41-.54.55-1.24.6-2.33" />
    <path d="M20.5 12h-12M18 15.5s3.5-2.58 3.5-3.5-3.5-3.5-3.5-3.5" />
  </svg>
);

/* ================================================================== */
/*  CONFIGURATIONS                                                     */
/* ================================================================== */

const NAV_LINKS = [
  { name: "FRESH DROP", href: "/collections/the-fresh-drop" },
  { name: "MEN", href: "/collections/men" },
  { name: "WOMEN", href: "/collections/women" },
  { name: "SMART", href: "/collections/smart-watches" },
  { name: "COUPLES", href: "/collections/for-couples" },
  { name: "TRACK ORDER", href: "/collections/track-order", active: true },
  { name: "CONTACT", href: "https://wa.me/923186643032" },
];

const ORDER_STAGES = [
  { key: "Order Placed", label: "Order Placed", desc: "Recorded in Vault" },
  { key: "Payment Verification", label: "Receipt Verified", desc: "Transaction Confirmed" },
  { key: "Quality Inspection", label: "Testing & Packing", desc: "Collector Box Pack" },
  { key: "Dispatched", label: "Dispatched", desc: "Handed to Courier" },
  { key: "Delivered", label: "Delivered", desc: "Arrived at Wrist" },
];

export default function TrackOrderPage() {
  const { data: session } = useSession();
  const searchInputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync cart counter badge
  // 🟢 Sync cart counter badge with total quantities
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const localCart = JSON.parse(localStorage.getItem("my_store_cart") || "[]");
        if (Array.isArray(localCart)) {
          // Har watch ki quantity jama (sum) karega
          const totalQty = localCart.reduce(
            (sum, item) => sum + (Number(item.quantity) || 1),
            0
          );
          setCartCount(totalQty);
        } else {
          setCartCount(0);
        }
      } catch (e) {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("focus", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("focus", updateCartCount);
    };
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.message || "No record found. Please verify your reference or phone number.");
      }
    } catch (err) {
      setError("Network timeout. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStageIndex = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("delivered")) return 4;
    if (s.includes("dispatch")) return 3;
    if (s.includes("inspect") || s.includes("pack")) return 2;
    if (s.includes("verif") || s.includes("paid")) return 1;
    return 0;
  };

  return (
    <div className="relative min-h-screen w-full bg-black font-jakarta text-white antialiased selection:bg-[#DCAA4A] selection:text-black">
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}} />

      {/* ================= DESKTOP & LAPTOP FLOATING DOCK ================= */}
      <header className="pointer-events-none fixed inset-x-0 top-5 z-[60] hidden justify-center px-4 lg:flex">
        <div className="pointer-events-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-[#DCAA4A]/25 bg-black/90 px-3.5 py-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl">
          <Link
            href="/"
            className="group mr-1 flex items-center gap-3 rounded-full py-1.5 pl-3 pr-4 transition-colors hover:bg-white/[0.06]"
          >
            <Image src={wLogo} alt="Logo" className="h-8 w-auto object-contain" priority />
            <span className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#DCAA4A] whitespace-nowrap">
              Elegance
            </span>
          </Link>

          <span className="h-6 w-px bg-white/10" />

          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative rounded-full px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors duration-300 whitespace-nowrap ${
                  link.active ? "text-black" : "text-neutral-300 hover:text-[#DCAA4A]"
                }`}
              >
                {link.active && (
                  <motion.span
                    layoutId="dock-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-[#DCAA4A]"
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </Link>
            ))}
          </nav>

          <span className="h-6 w-px bg-white/10" />

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 pl-1">
            <Link
              href="/collections/the-fresh-drop"
              className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition-all hover:bg-[#DCAA4A]/15 hover:text-[#DCAA4A]"
            >
              <IconBag className="h-[18px] w-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#DCAA4A] px-1 text-[10px] font-extrabold text-black whitespace-nowrap">
                  {cartCount}
                </span>
              )}
            </Link>

            {session ? (
              <div className="ml-1 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-2">
                <Image
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  width={30}
                  height={30}
                  className="h-[30px] w-[30px] rounded-full border border-[#DCAA4A]/40 object-cover"
                />
                <span className="max-w-[100px] truncate text-xs font-bold text-neutral-200 whitespace-nowrap">
                  {session.user?.name?.split(" ")[0]}
                </span>
                {/* 🟢 Collection Page Exact Logout Button */}
                <button
                  type="button"
                  onClick={() => signOut()}
                  aria-label="Sign out"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-[#DCAA4A]/15 hover:text-[#DCAA4A]"
                >
                  <IconLogout className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google")}
                className="ml-1 flex cursor-pointer items-center gap-2 rounded-full bg-[#DCAA4A] px-5 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-black transition-shadow hover:shadow-[0_0_25px_-5px_#DCAA4A] whitespace-nowrap"
              >
                <IconUser className="h-4 w-4" />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ================= MOBILE & TABLET TOP LOGO BAR ================= */}
      <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4 lg:hidden pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-[#DCAA4A]/25 bg-black/85 px-4 py-2 shadow-2xl backdrop-blur-xl"
        >
          <Image src={wLogo} alt="Logo" className="h-7 w-auto object-contain" priority />
          <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#DCAA4A] whitespace-nowrap">
            Elegance
          </span>
        </Link>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION DOCK ================= */}
      <nav className="fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4 lg:hidden pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[#DCAA4A]/25 bg-black/90 px-3 py-2 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Menu"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition-colors active:bg-[#DCAA4A]/20 active:text-[#DCAA4A]"
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            aria-label="Search"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition-colors active:bg-[#DCAA4A]/20 active:text-[#DCAA4A]"
          >
            <IconSearch className="h-5 w-5" />
          </button>

          <Link
            href="/collections/the-fresh-drop"
            aria-label="Cart"
            className="relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-[#DCAA4A] text-black shadow-[0_0_24px_-4px_#DCAA4A]"
          >
            <IconBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-black bg-white px-1 text-[10px] font-extrabold text-black whitespace-nowrap">
                {cartCount}
              </span>
            )}
          </Link>

          {session ? (
            <>
              <div className="flex h-11 w-11 items-center justify-center">
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={34}
                  height={34}
                  className="h-8.5 w-8.5 rounded-full border border-[#DCAA4A]/50 object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                aria-label="Sign out"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition-colors active:bg-[#DCAA4A]/20 active:text-[#DCAA4A]"
              >
                <IconLogout className="h-5 w-5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signIn("google")}
              aria-label="Login"
              className="flex h-11 items-center gap-1.5 rounded-full border border-[#DCAA4A]/40 px-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[#DCAA4A] whitespace-nowrap"
            >
              <IconUser className="h-4 w-4" />
              Login
            </button>
          )}
        </div>
      </nav>

      {/* ================= MOBILE DRAWER ================= */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed left-0 top-0 z-[75] flex h-full w-[85%] max-w-[320px] flex-col border-r border-amber-500/20 bg-neutral-950 p-5 shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <div className="flex items-center gap-3">
                  <Image src={wLogo} alt="Logo" className="h-7 w-auto object-contain" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#DCAA4A] whitespace-nowrap">
                    Elegance
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full p-1.5 text-neutral-400 hover:text-white"
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto py-6">
                <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-500 whitespace-nowrap">
                  Navigation
                </span>
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block rounded-xl py-3 px-4 text-xs font-extrabold uppercase tracking-wider transition-colors whitespace-nowrap ${
                      link.active
                        ? "bg-[#DCAA4A] text-black"
                        : "text-neutral-300 hover:bg-neutral-900 hover:text-[#DCAA4A]"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              {session && (
                <div className="flex items-center justify-between border-t border-neutral-900 pt-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full border border-amber-500/40 object-cover"
                    />
                    <span className="truncate text-xs font-bold text-neutral-200">
                      {session.user.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:text-[#DCAA4A]"
                  >
                    <IconLogout className="h-5 w-5" />
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ================= HERO & SEARCH SECTION ================= */}
      <section className="relative overflow-hidden border-b border-white/[0.07] bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-black pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[580px] -translate-x-1/2 rounded-full bg-[#DCAA4A]/10 blur-[140px]" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block rounded-full border border-[#DCAA4A]/30 bg-[#DCAA4A]/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.25em] text-[#DCAA4A] whitespace-nowrap"
          >
            Vault Dispatch Radar
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight"
          >
            Track Your{" "}
            <span className="bg-gradient-to-r from-[#DCAA4A] via-[#f7e2a9] to-[#DCAA4A] bg-clip-text text-transparent whitespace-nowrap">
              Timepiece
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-xs sm:text-sm md:text-base font-medium text-neutral-300 leading-relaxed"
          >
            Enter your Order ID (e.g. <strong className="text-white whitespace-nowrap">#ORD-XXXXXX</strong>) or your registered WhatsApp mobile number to inspect real-time progress.
          </motion.p>

          {/* SEARCH INPUT BAR */}
          <motion.form
            onSubmit={handleTrack}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.28 }}
            className="relative mx-auto mt-8 sm:mt-10 max-w-2xl"
          >
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl border border-amber-500/35 bg-neutral-950/85 p-2 shadow-[0_0_50px_rgba(245,158,11,0.15)] backdrop-blur-xl transition-all focus-within:border-amber-400 focus-within:shadow-[0_0_60px_rgba(245,158,11,0.25)] gap-2 sm:gap-0">
              <div className="flex items-center flex-1 px-3">
                <span className="text-amber-400 shrink-0">
                  <IconSearch className="h-5 w-5" />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Order ID (#ORD-XXXXXX) or Phone..."
                  className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm md:text-base font-bold text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-black shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "Searching..." : "Track Consignment"}
              </button>
            </div>
          </motion.form>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-xs sm:text-sm font-bold text-red-400"
            >
              ⚠️ {error}
            </motion.p>
          )}
        </div>
      </section>

      {/* ================= TRACKING RESULT DISPLAY ================= */}
      <AnimatePresence>
        {order && (
          <section className="relative mx-auto max-w-5xl px-4 sm:px-6 md:px-8 py-12 sm:py-16 pb-28 lg:pb-16">
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#111] via-neutral-950 to-black p-5 sm:p-8 md:p-10 shadow-[0_0_80px_rgba(245,158,11,0.12)]"
            >
              {/* ORDER HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 sm:pb-8">
                <div>
                  <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-neutral-400 block whitespace-nowrap">
                    Live Tracking Record
                  </span>
                  <h2 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#DCAA4A] whitespace-nowrap">
                    {order.orderId}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-neutral-400 whitespace-nowrap">
                    Placed on: {new Date(order.createdAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}
                  </p>
                </div>

                <div className="self-start sm:self-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400 whitespace-nowrap">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {order.status}
                  </span>
                </div>
              </div>

              {/* TIMELINE PROGRESS TRACKER */}
              <div className="my-8 sm:my-12">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-neutral-400 mb-6 sm:mb-8 whitespace-nowrap">
                  Consignment Milestones
                </h3>

                <div className="relative">
                  {/* Connecting Horizontal Line (Laptops/Tablets) */}
                  <div className="absolute top-5 left-6 right-6 h-0.5 bg-neutral-800 hidden md:block">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(getCurrentStageIndex(order.status) / (ORDER_STAGES.length - 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.9, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_15px_#DCAA4A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-5 sm:gap-6 relative z-10">
                    {ORDER_STAGES.map((stage, idx) => {
                      const currentIdx = getCurrentStageIndex(order.status);
                      const isComplete = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div
                          key={stage.key}
                          className="flex md:flex-col items-center md:text-center gap-3.5 sm:gap-4 md:gap-3 bg-neutral-900/40 md:bg-transparent p-3 md:p-0 rounded-2xl border md:border-0 border-white/[0.05]"
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                              isComplete
                                ? "border-amber-400 bg-amber-400 text-black shadow-[0_0_20px_rgba(220,170,74,0.4)]"
                                : "border-neutral-800 bg-neutral-900 text-neutral-500"
                            } ${isCurrent ? "scale-105 ring-4 ring-amber-400/20" : ""}`}
                          >
                            {isComplete ? "✓" : idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs sm:text-sm font-bold tracking-wide uppercase whitespace-nowrap ${
                              isComplete ? "text-white" : "text-neutral-500"
                            }`}>
                              {stage.label}
                            </p>
                            <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 leading-tight whitespace-nowrap">
                              {stage.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* WATCH PRODUCTS IN ORDER */}
              <div className="border-t border-white/10 pt-8 sm:pt-10">
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-neutral-400 mb-6 whitespace-nowrap">
                  Vault Consignment Details ({order.items.length} Items)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4 transition-colors hover:border-amber-500/40"
                    >
                      <div className="relative h-18 w-18 sm:h-20 sm:w-20 shrink-0 rounded-xl bg-black p-2 border border-neutral-800 flex items-center justify-center">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-500 block truncate whitespace-nowrap">
                          {item.spec}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white truncate">
                          {item.title}
                        </h4>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-400 whitespace-nowrap">
                            Qty: <strong className="text-white">{item.quantity}</strong>
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-[#DCAA4A] whitespace-nowrap">
                            {item.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CONSIGNMENT & RECIPIENT INFORMATION */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 border-t border-white/10 pt-8">
                {/* Destination */}
                <div className="space-y-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#DCAA4A] mb-3 whitespace-nowrap">
                    Recipient Destination
                  </h4>
                  <p className="text-xs sm:text-sm font-medium text-neutral-300">
                    <span className="text-neutral-500 uppercase font-bold mr-2">Customer:</span>
                    <strong className="text-white">{order.name}</strong>
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-neutral-300">
                    <span className="text-neutral-500 uppercase font-bold mr-2">Contact:</span>
                    <span className="font-mono text-white">+{order.phone}</span>
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-neutral-300">
                    <span className="text-neutral-500 uppercase font-bold mr-2">Shipping Address:</span>
                    <span className="text-neutral-200">{order.address}</span>
                  </p>
                </div>

                {/* Invoice & WhatsApp Concierge */}
                <div className="space-y-2.5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#DCAA4A] mb-3 whitespace-nowrap">
                      Billing & Settlement
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-neutral-300">
                      <span className="text-neutral-500 uppercase font-bold mr-2">Payment Method:</span>
                      <strong className="text-white">{order.paymentMethod}</strong>
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-neutral-300">
                      <span className="text-neutral-500 uppercase font-bold mr-2">Total Bill:</span>
                      <span className="text-base sm:text-lg font-black text-[#DCAA4A] whitespace-nowrap">
                        {order.totalPrice}
                      </span>
                    </p>
                  </div>

                 <div className="pt-3">
                    <a
                      href={`https://wa.me/923186643032?text=${encodeURIComponent(
                        `Assalam-o-Alaikum! Inquiring regarding order ${order.orderId}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full gap-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-[#25D366] hover:bg-[#25D366] hover:text-black transition-all whitespace-nowrap shadow-[0_0_20px_rgba(37,211,102,0.15)] hover:shadow-[0_0_25px_rgba(37,211,102,0.35)]"
                    >
                      {/* WhatsApp Official SVG Logo */}
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99 0-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      <span>WhatsApp Support</span>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}
      </AnimatePresence>
    </div>
  );
}