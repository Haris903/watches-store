"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import wLogo from "@/public/wLogo.png";
import { usePathname } from "next/navigation";

/* ================================================================== */
/*  DATA CONFIGURATION                                                */
/* ================================================================== */

const NAV_LINKS = [
  { name: "FRESH DROP", href: "/collections/the-fresh-drop", collection: "freshdrop" },
  { name: "MEN", href: "/collections/men", collection: "men" },
  { name: "WOMEN", href: "/collections/women", collection: "women" },
  { name: "SMART", href: "/collections/smart-watches", collection: "smart" },
  { name: "COUPLES", href: "/collections/for-couples", collection: "couples" },
  { name: "TRACK ORDER", href: "/collections/track-order" },
  { name: "CONTACT", href: "https://wa.me/923186643032" },
];

const CATEGORIES = [
  "All Timepieces",
  "Chronograph",
  "Automatic",
  "Steel Edition",
  "Leather Strap",
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

// Fallback Default Data (Jab DB khali ho)


// ----- COLLECTION META DATA (Ab isme koi hardcoded watch array nahi hai) -----
const COLLECTIONS = {
  men: {
    label: "Men",
    href: "/collections/men",
    hero: {
      subtitle: "The Men's Collection",
      title: "Crafted For Uncompromising Power",
      description: "Every case is machined, weighted and finished to sit like it belongs on your wrist. Sapphire glass, surgical steel and movements calibrated to outlive the trend that sold them.",
      badges: ["100% Original Steel", "2 Years Warranty", "Free Nationwide Delivery"],
      stats: [{ v: "12,400+", k: "Owners" }, { v: "4.9 / 5", k: "Rated" }, { v: "48 Hrs", k: "Tested" }, { v: "5 ATM", k: "Resistance" }],
    },
  },
  women: {
    label: "Women",
    href: "/collections/women",
    hero: {
      subtitle: "The Women's Collection",
      title: "Designed For Timeless Elegance",
      description: "Refined, delicate and unmistakably sophisticated. Our women's timepieces combine precision with artistry, using mother-of-pearl, diamonds, and supple leather to celebrate every moment.",
      badges: ["Authentic Materials", "2 Years Warranty", "Free Nationwide Delivery"],
      stats: [{ v: "8,200+", k: "Owners" }, { v: "4.8 / 5", k: "Rated" }, { v: "48 Hrs", k: "Tested" }, { v: "3 ATM", k: "Resistance" }],
    },
  },
  freshdrop: {
    label: "Fresh Drop",
    href: "/collections/the-fresh-drop",
    hero: {
      subtitle: "The Fresh Drop",
      title: "New Arrivals – Limited Edition",
      description: "Be the first to own our latest creations. These exclusive timepieces are released in small batches, each one individually numbered and finished with the finest materials available.",
      badges: ["Limited Quantities", "2 Years Warranty", "Free Nationwide Delivery"],
      stats: [{ v: "1,200+", k: "Owners" }, { v: "4.9 / 5", k: "Rated" }, { v: "48 Hrs", k: "Tested" }, { v: "5 ATM", k: "Resistance" }],
    },
  },
  smart: {
    label: "Smart",
    href: "/collections/smart-watches",
    hero: {
      subtitle: "Smart Watches",
      title: "Intelligent Timepieces",
      description: "Experience the future of timekeeping with our smart watches. Featuring AMOLED displays, heart rate sensors, GPS, and seamless connectivity – all wrapped in a design that speaks elegance.",
      badges: ["AMOLED Display", "GPS Tracking", "Free Nationwide Delivery"],
      stats: [{ v: "5,400+", k: "Owners" }, { v: "4.7 / 5", k: "Rated" }, { v: "7 Days", k: "Battery" }, { v: "IP68", k: "Waterproof" }],
    },
  },
  couples: {
    label: "Couples",
    href: "/collections/for-couples",
    hero: {
      subtitle: "For Couples",
      title: "Two Hearts, One Time",
      description: "Celebrate your bond with perfectly matched timepieces. Each set is curated to complement both personalities, creating a timeless symbol of unity and shared moments.",
      badges: ["Matching Sets", "2 Years Warranty", "Free Nationwide Delivery"],
      stats: [{ v: "3,800+", k: "Couples" }, { v: "4.9 / 5", k: "Rated" }, { v: "48 Hrs", k: "Tested" }, { v: "5 ATM", k: "Resistance" }],
    },
  },
};

const PAYMENT_DATA = {
  JAZZCASH: { label: "JAZZCASH NUMBER", number: "0300 1234567", accountTitle: "Muhammad Haris", instruction: "Send via JazzCash app or any Jazz franchise." },
  EASYPAISA: { label: "EASYPAISA NUMBER", number: "0318 6643032", accountTitle: "Muhammad Haris", instruction: "Send via EasyPaisa app or any EasyPaisa agent." },
  "BANK TRANSFER": { label: "ACCOUNT / IBAN", number: "PK36 MEZN 0001 2345 6789 01", accountTitle: "Muhammad Haris Sakhi", instruction: "Transfer via any mobile banking app or ATM (Meezan Bank)." },
};

/* ================================================================== */
/*  HELPERS                                                           */
/* ================================================================== */

const parsePrice = (p) => (p ? Number(String(p).replace(/[^0-9]/g, "")) || 0 : 0);

const calculateTotal = (items) => {
  const total = items.reduce(
    (s, i) => s + parsePrice(i.price) * (Number(i.quantity) || 1),
    0
  );
  return `Rs. ${total.toLocaleString("en-PK")}`;
};

function Stars({ rating, size = "h-[18px] w-[18px]" }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={`${size} ${i < Math.round(rating) ? "fill-[#DCAA4A]" : "fill-neutral-700"}`}>
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

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
const IconLogout = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14.5 6c-.05-1.1-.19-1.79-.6-2.33a2.9 2.9 0 0 0-.55-.55C12.54 2.5 11.36 2.5 9.01 2.5H8.5C5.68 2.5 4.26 2.5 3.38 3.38 2.5 4.26 2.5 5.67 2.5 8.5v7c0 2.83 0 4.24.88 5.12.88.88 2.3.88 5.12.88h.51c2.35 0 3.53 0 4.34-.62.21-.16.4-.35.55-.55.41-.54.55-1.24.6-2.33" />
    <path d="M20.5 12h-12M18 15.5s3.5-2.58 3.5-3.5-3.5-3.5-3.5-3.5" />
  </svg>
);

/* ================================================================== */
/*  FLOATING GLASS DOCK NAVIGATION                                    */
/* ================================================================== */

function FloatingDock({ session, cartCount, isMounted, onCart, onSearch, onMenu, scrolled, currentCollection, onCollectionChange, hidden }) {
  const handleNavClick = (e, link) => {
    if (link.collection) {
      e.preventDefault();
      // ⚡ URL bina kisi page reload ya lag ke foran badal jayega:
      window.history.pushState(null, "", link.href);
      onCollectionChange(link.collection);
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={hidden ? { y: -120, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none fixed inset-x-0 top-5 z-[60] hidden justify-center px-3 sm:px-4 lg:px-6 lg:flex"
      >
        <div
          className={`pointer-events-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-1.5 sm:gap-2 rounded-full border border-[#DCAA4A]/25 px-3 py-2.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl transition-colors duration-500 ${
            scrolled ? "bg-black/90" : "bg-white/[0.045]"
          }`}
        >
          <Link
            href="/"
            className="group mr-1 flex items-center gap-3 rounded-full py-1.5 pl-3 pr-5 transition-colors hover:bg-white/[0.06]"
          >
            <Image src={wLogo} alt="Elegance On Your Wrist" className="h-9 w-auto object-contain" priority />
            <span className="hidden text-[12px] md:text-[13px] lg:text-[14px] font-extrabold uppercase leading-none tracking-[0.16em] text-[#DCAA4A] xl:block">
              Elegance
            </span>
          </Link>

          <span className="h-7 w-px bg-white/10" />

          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = link.collection && link.collection === currentCollection;
              const external = link.href?.startsWith("http");
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`relative rounded-full px-2 lg:px-3 py-2 lg:py-2.5 text-[10px] md:text-[11px] lg:text-[12px] xl:text-[13px] font-extrabold uppercase tracking-[0.1em] lg:tracking-[0.12em] transition-colors duration-300 xl:px-4 ${
                    active ? "text-black" : "text-neutral-300 hover:text-[#DCAA4A]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dock-active"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-[#DCAA4A]"
                    />
                  )}
                  <span className="relative whitespace-nowrap z-10">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <span className="h-7 w-px bg-white/10" />

          <div className="flex items-center gap-1.5 pl-1">
            <button onClick={onSearch} aria-label="Search" className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition-all hover:bg-[#DCAA4A]/15 hover:text-[#DCAA4A]">
              <IconSearch className="h-[19px] w-[19px]" />
            </button>

            <button onClick={onCart} aria-label="Open cart" className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition-all hover:bg-[#DCAA4A]/15 hover:text-[#DCAA4A]">
              <IconBag className="h-[19px] w-[19px]" />
              {isMounted && cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#DCAA4A] px-1 text-[10px] md:text-[11px] font-extrabold text-black"
                >
                  {cartCount}
                </motion.span>
              )}
            </button>

            {session ? (
              <div className="ml-1 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-2">
                <Image src={session.user.image} alt={session.user.name || "Profile"} width={34} height={34} className="h-[34px] w-[34px] rounded-full border border-[#DCAA4A]/40 object-cover" />
                <span className="max-w-[110px] truncate text-[11px] md:text-[12px] lg:text-[13px] font-bold text-neutral-200">
                  {session.user?.name?.split(" ")[0]}
                </span>
                <button onClick={() => signOut()} aria-label="Sign out" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-[#DCAA4A]/15 hover:text-[#DCAA4A]">
                  <IconLogout className="h-[19px] w-[19px]" />
                </button>
              </div>
            ) : (
              <button onClick={() => signIn("google")} className="ml-1 flex cursor-pointer items-center gap-2 rounded-full bg-[#DCAA4A] px-5 py-2.5 md:px-6 md:py-3 text-[11px] md:text-[12px] lg:text-[13px] font-extrabold uppercase tracking-[0.14em] text-black transition-shadow hover:shadow-[0_0_30px_-6px_#DCAA4A]">
                <IconUser className="h-[17px] w-[17px]" />
                Login
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={hidden ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4 lg:hidden"
      >
        <Link href="/" className="flex items-center gap-3 rounded-full border border-[#DCAA4A]/25 bg-black/80 px-5 py-2.5 shadow-[0_16px_44px_-18px_rgba(0,0,0,1)] backdrop-blur-xl">
          <Image src={wLogo} alt="Logo" className="h-8 w-auto object-contain" priority />
          <span className="text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.2em] text-[#DCAA4A]">
            Elegance
          </span>
        </Link>
      </motion.div>
      
      <motion.nav
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 bottom-5 z-[60] flex justify-center px-5 lg:hidden"
      >
        <div className="flex items-center gap-1.5 rounded-full border border-[#DCAA4A]/25 bg-black/85 px-3 py-2.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,1)] backdrop-blur-xl">
          <button onClick={onMenu} aria-label="Menu" className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition-colors active:bg-[#DCAA4A]/20 active:text-[#DCAA4A]">
            <IconMenu className="h-[22px] w-[22px]" />
          </button>
          <button onClick={onSearch} aria-label="Search" className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition-colors active:bg-[#DCAA4A]/20 active:text-[#DCAA4A]">
            <IconSearch className="h-[21px] w-[21px]" />
          </button>
          <button onClick={onCart} aria-label="Cart" className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#DCAA4A] text-black shadow-[0_0_28px_-6px_#DCAA4A]">
            <IconBag className="h-[23px] w-[23px]" />
            {isMounted && cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 min-w-[24px] items-center justify-center rounded-full border-2 border-black bg-white px-1 text-[11px] sm:text-[12px] font-extrabold text-black">
                {cartCount}
              </span>
            )}
          </button>

          {session ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center">
                <Image src={session.user.image} alt="Profile" width={38} height={38} className="h-[38px] w-[38px] rounded-full border border-[#DCAA4A]/50 object-cover" />
              </div>
              <button onClick={() => signOut()} aria-label="Sign out" className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-neutral-300 transition-colors active:bg-[#DCAA4A]/20 active:text-[#DCAA4A]">
                <IconLogout className="h-[21px] w-[21px]" />
              </button>
            </>
          ) : (
            <button onClick={() => signIn("google")} aria-label="Login" className="flex h-12 items-center gap-2 rounded-full border border-[#DCAA4A]/40 px-5 text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#DCAA4A]">
              <IconUser className="h-[17px] w-[17px]" />
              Login
            </button>
          )}
        </div>
      </motion.nav>
    </>
  );
}

/* ================================================================== */
/*  PRODUCT CARD (Responsive Luxury Stacked Badges)                   */
/* ================================================================== */

/* ================================================================== */
/*  PRODUCT CARD (Fast Hardware-Accelerated Hover)                     */
/* ================================================================== */

function ProductCard({ watch, index, inCart, onAdd, onQuickView }) {
  const isOutOfStock = (watch.stock ?? 10) <= 0;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: "easeOut" }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-[#171717] via-[#0d0d0d] to-[#050505] transition-colors duration-200 hover:border-[#DCAA4A]/45 hover:shadow-[0_0_40px_-12px_rgba(220,170,74,0.3)]"
    >
      <div className="relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#262626_0%,#080808_68%)] sm:aspect-[4/5]">
        
        {/* TOP LEFT: TAG + STOCK STATUS STACK */}
        <div className="absolute left-3.5 top-3.5 sm:left-5 sm:top-5 z-20 flex flex-col items-start gap-1.5 pointer-events-none">
          {watch.tag && (
            <span
              className={`rounded-full px-3 py-1 sm:px-3.5 sm:py-1 text-[9px] sm:text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.16em] shadow-md backdrop-blur-md ${
                watch.tag === "NEW"
                  ? "bg-[#DCAA4A] text-black"
                  : "border border-[#DCAA4A]/45 bg-black/75 text-[#DCAA4A]"
              }`}
            >
              {watch.tag}
            </span>
          )}

          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-widest backdrop-blur-md border ${
              isOutOfStock
                ? "bg-red-500/20 text-red-400 border-red-500/40"
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isOutOfStock ? "bg-red-400" : "bg-emerald-400 animate-pulse"
              }`}
            />
            {isOutOfStock ? "Out of Stock" : "In Stock"}
          </span>
        </div>

        {/* TOP RIGHT: RATING BADGE */}
        <span className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 sm:px-3 sm:py-1.5 backdrop-blur-md pointer-events-none">
          <svg viewBox="0 0 20 20" className="h-[12px] w-[12px] sm:h-[14px] sm:w-[14px] fill-[#DCAA4A]">
            <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
          </svg>
          <span className="text-[11px] sm:text-[12px] md:text-[13px] font-extrabold text-white">
            {watch.rating?.toFixed(1) || "4.9"}
          </span>
        </span>

        {/* Ambient Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#DCAA4A]/0 blur-3xl transition-opacity duration-300 group-hover:bg-[#DCAA4A]/20" />

        {/* ⚡ Fast Watch Image (Snappy 250ms & GPU Rendered) */}
        <img
          src={watch.image}
          alt={watch.title}
          draggable={false}
          className={`relative z-10 h-full w-full object-contain p-8 sm:p-10 drop-shadow-[0_12px_18px_rgba(0,0,0,0.8)] transform-gpu will-change-transform transition-transform duration-250 ease-out ${
            isOutOfStock ? "grayscale opacity-40" : "group-hover:scale-105"
          }`}
        />

        {/* ⚡ Instant Hover Overlay & Quick View Button (200ms) */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center bg-gradient-to-t from-black/80 via-transparent to-transparent p-5 sm:p-7 opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onQuickView(watch)}
            className="pointer-events-auto cursor-pointer rounded-full border border-[#DCAA4A]/60 bg-black/85 px-6 py-2.5 sm:px-8 sm:py-3 text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#DCAA4A] shadow-lg backdrop-blur-md transform-gpu transition-all duration-200 hover:scale-105 hover:bg-[#DCAA4A] hover:text-black"
          >
            Quick View
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 sm:gap-3 border-t border-white/[0.06] p-5 sm:p-6 lg:p-7">
        <p className="text-[11px] sm:text-[12px] md:text-[13px] font-extrabold uppercase tracking-[0.22em] text-[#DCAA4A]/80">
          {watch.category}
        </p>

        <h3 className="text-base sm:text-lg md:text-xl font-extrabold uppercase leading-snug tracking-[0.03em] text-white transition-colors duration-200 group-hover:text-[#DCAA4A] truncate">
          {watch.title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Stars rating={watch.rating || 4.9} size="h-[14px] w-[14px] sm:h-[18px] sm:w-[18px]" />
          <span className="text-[12px] sm:text-[13px] md:text-[14px] font-bold text-neutral-400">
            {watch.rating?.toFixed(1) || "4.9"} · {watch.reviews || 24} reviews
          </span>
        </div>

        <p className="text-[11px] sm:text-[12px] md:text-[13px] font-bold uppercase tracking-[0.16em] text-neutral-500 truncate">
          {watch.spec}
        </p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
          <div>
            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#DCAA4A]">
              {watch.price}
            </p>
            {watch.original && (
              <p className="mt-0.5 text-sm font-bold text-neutral-600 line-through">
                {watch.original}
              </p>
            )}
          </div>

          <motion.button
            type="button"
            disabled={isOutOfStock}
            whileTap={!isOutOfStock ? { scale: 0.96 } : {}}
            onClick={() => onAdd(watch)}
            className={`cursor-pointer rounded-full border px-4 py-2 sm:px-6 sm:py-3 text-[11px] sm:text-[12px] md:text-[13px] font-extrabold uppercase tracking-[0.16em] transition-colors duration-200 ${
              isOutOfStock
                ? "border-neutral-800 bg-neutral-900 text-neutral-500 cursor-not-allowed"
                : inCart
                ? "border-[#DCAA4A] bg-[#DCAA4A] text-black"
                : "border-white/20 text-white hover:border-[#DCAA4A] hover:bg-[#DCAA4A] hover:text-black"
            }`}
          >
            {isOutOfStock ? "Out of Stock" : inCart ? "In Cart" : "+ Add To Cart"}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ================================================================== */
/*  MAIN PAGE COMPONENT                                               */
/* ================================================================== */

export default function MenWatchesCollectionPage() {
  const pathname = usePathname();

  // 1. ALL CORE STATES DECLARED AT THE TOP
  const [currentCollection, setCurrentCollection] = useState("freshdrop");
  const [activeCategory, setActiveCategory] = useState("All Timepieces");
  const [sortBy, setSortBy] = useState("featured");

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isFilterStuck, setIsFilterStuck] = useState(false);

  // Cart & Checkout
  const [cart, setCart] = useState([]);
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [selectedCartIndexes, setSelectedCartIndexes] = useState([]);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [isCheckout, setIsCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("JAZZCASH");
  const [copiedField, setCopiedField] = useState(null);
  const [screenshotName, setScreenshotName] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Live Database Watches
  const [dbWatches, setDbWatches] = useState([]);

  // Session & Refs
  const { data: session, status } = useSession();
  const searchInputRef = useRef(null);
  const filterSentinelRef = useRef(null);
  const isInitialSync = useRef(true);

  

  // 2. PATHNAME BASED COLLECTION AUTO-SELECTION
  // 🟢 Browser Back/Forward buttons dabane par URL & Collection sync
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes("the-fresh-drop")) {
        setCurrentCollection("freshdrop");
      } else if (path.includes("women")) {
        setCurrentCollection("women");
      } else if (path.includes("men")) {
        setCurrentCollection("men");
      } else if (path.includes("smart-watches")) {
        setCurrentCollection("smart");
      } else if (path.includes("for-couples")) {
        setCurrentCollection("couples");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 3. FETCH LIVE WATCHES FROM DATABASE
  // 🟢 3. LIVE AUTO-SYNC: Har 3 sec baad silently check karega (Bina Page Refresh ke)
  // 3. FETCH LIVE WATCHES & INSTANT CART AUTO-PURGE
  useEffect(() => {
    let isSubscribed = true;

    async function fetchLiveWatches() {
      try {
        const res = await fetch("/api/admin/products", { cache: "no-store" });
        const data = await res.json();
        
        if (data.success && isSubscribed) {
          const rawList = data.watches || [];
          const formatted = rawList.map((w) => ({
            id: w._id,
            _id: w._id,
            title: w.title,
            category: w.subCategory || (["Chronograph", "Automatic", "Steel Edition", "Leather Strap"].includes(w.category) ? w.category : "Automatic"),
            collection: (w.collectionName || w.category || "").toLowerCase().trim(),
            price: typeof w.price === "number" ? `Rs. ${w.price.toLocaleString("en-PK")}` : w.price,
            original: w.originalPrice 
              ? `Rs. ${Math.round(Number(w.originalPrice)).toLocaleString("en-PK")}` 
              : "",
            rating: Number(w.rating) || 4.9,
            reviews: Number(w.reviews) || 24,
            stock: Number(w.stock) ?? 0,
            tag: w.tag || null,
            spec: w.spec || "SWISS PRECISION MOVEMENT",
            description: w.description || "",
            image: w.image || "/wClassic.png",
          }));

          setDbWatches(formatted);

          // ⚡ INSTANT PURGE: Agar cart mein koi item Out of Stock ya Delete ho gaya to foran nikaal do
        // ⚡ LIVE CART STOCK SYNC & AUTO-PURGE
          setCart((prevCart) => {
            if (!prevCart || prevCart.length === 0) return prevCart;

            let hasChanged = false;
            const updatedCart = [];

            for (const item of prevCart) {
              const liveMatch = rawList.find(
                (w) => String(w._id) === String(item.id || item._id)
              );

              // 1. Agar item DB se delete ho gaya ya stock 0 ho gaya, toh cart se remove karein
              if (!liveMatch || Number(liveMatch.stock) <= 0) {
                hasChanged = true;
                continue;
              }

              const freshStock = Number(liveMatch.stock);
              const currentQty = Number(item.quantity) || 1;
              const safeQty = Math.min(currentQty, freshStock);

              // 2. Agar stock ya quantity mein koi farq aaya hai toh flag true karein
              if (item.stock !== freshStock || currentQty !== safeQty) {
                hasChanged = true;
              }

              // 3. Cart item mein fresh stock aur safe quantity inject karein
              updatedCart.push({
                ...item,
                stock: freshStock,
                quantity: safeQty,
              });
            }

            if (hasChanged) {
              localStorage.setItem("my_store_cart", JSON.stringify(updatedCart));
              return updatedCart;
            }
            return prevCart;
          });
        }
      } catch (err) {
        console.error("Live products fetch error:", err);
      }
    }

    fetchLiveWatches();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLiveWatches();
      }
    }, 2500);

    const handleFocus = () => fetchLiveWatches();
    window.addEventListener("focus", handleFocus);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // 4. DATA DERIVATION & FILTERING
  const collectionData = COLLECTIONS[currentCollection] || COLLECTIONS.freshdrop;

  // Main Collection Level Filter
  const watches = useMemo(() => {
    return dbWatches.filter(
      (w) => (w.collection || "").toLowerCase() === (currentCollection || "").toLowerCase()
    );
  }, [dbWatches, currentCollection]);

  const hero = collectionData.hero;

  // Sub-Category Level Filter (All Timepieces, Chronograph, Automatic, etc.)
  const visibleWatches = useMemo(() => {
    let list = [];
    if (activeCategory === "All Timepieces") {
      list = [...watches];
    } else {
      list = watches.filter(
        (w) => (w.category || "").toLowerCase() === activeCategory.toLowerCase()
      );
    }

    switch (sortBy) {
      case "price-low": return list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      case "price-high": return list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      case "rating": return list.sort((a, b) => b.rating - a.rating);
      default: return list;
    }
  }, [activeCategory, sortBy, watches]);

  const cartIds = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);

  // 5. AUTH & CART SYNCHRONIZATION
  useEffect(() => {
    setIsMounted(true);
    const syncOnAuthChange = async () => {
      if (status === "loading") return;

      if (session?.user) {
        isInitialSync.current = true;
        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              const dbCart = data.cart || [];
              setCart(dbCart);
              localStorage.setItem("my_store_cart", JSON.stringify(dbCart));
            }
          }
        } catch (err) {
          console.error("Cart fetch error:", err);
        } finally {
          isInitialSync.current = false;
        }
      } else {
        try {
          const localCart = JSON.parse(localStorage.getItem("my_store_cart") || "[]");
          setCart(Array.isArray(localCart) ? localCart : []);
        } catch (err) {
          console.error("Corrupted local cart cleared:", err);
          localStorage.removeItem("my_store_cart");
          setCart([]);
        }
        isInitialSync.current = false;
      }
    };

    syncOnAuthChange();
  }, [session, status]);

  // Debounced LocalStorage & Database Cart Update
  useEffect(() => {
    if (!isMounted || isInitialSync.current) return;
    localStorage.setItem("my_store_cart", JSON.stringify(cart));

    if (!session?.user) return;

    const timer = setTimeout(() => {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      }).catch((err) => console.error("Database update error:", err));
    }, 800);

    return () => clearTimeout(timer);
  }, [cart, isMounted, session]);

  // Scroll & Sticky Bar Observer
  useEffect(() => {
    const el = filterSentinelRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      setIsFilterStuck(rect.top <= 104);
      setScrolled(window.scrollY > 50);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Keyboard Shortcuts & Body Scroll Lock
  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 120);
  }, [isSearchOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setIsSearchOpen(false);
      setIsCartOpen(false);
      setIsMobileMenuOpen(false);
      if (!isCheckout) setSelectedWatch(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCheckout]);

  useEffect(() => {
    const lock = isMobileMenuOpen || isCartOpen || isSearchOpen || selectedWatch || isCheckout;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen, isCartOpen, isSearchOpen, selectedWatch, isCheckout]);

  // Handlers
 // 🟢 Cart mein add karna (Quantity support ke sath)
  const handleAddToCart = (watch, customQty = 1) => {
    if ((watch.stock ?? 10) <= 0) return;

    setCart((prev) => {
      const idx = prev.findIndex((item) => (item.id || item._id) === (watch.id || watch._id));
      if (idx > -1) {
        const updated = [...prev];
        const currentQty = updated[idx].quantity || 1;
        const maxLimit = watch.stock ?? 99;
        updated[idx] = { ...updated[idx], quantity: Math.min(currentQty + customQty, maxLimit) };
        return updated;
      }
      return [...prev, { ...watch, quantity: customQty }];
    });

    setSelectedWatch(null);
    setIsCheckout(false);
    setIsCartOpen(true);
  };

  // 🟢 [-] 1 [+] Quantity Handler
  const handleUpdateQuantity = (idx, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[idx];
      const currentQty = item.quantity || 1;
      const maxLimit = item.stock ?? 99;
      const newQty = currentQty + delta;

      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      if (newQty > maxLimit) return prev;

      updated[idx] = { ...item, quantity: newQty };
      return updated;
    });
  };

  

  const handleToggleCartSelect = (i) =>
    setSelectedCartIndexes((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleRemoveFromCart = (indexToRemove) => {
    setCart((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setSelectedCartIndexes((prev) =>
      prev.filter((i) => i !== indexToRemove).map((i) => (i > indexToRemove ? i - 1 : i))
    );
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    const itemsToBuy =
      selectedCartIndexes.length === 0 || selectedCartIndexes.length === cart.length
        ? [...cart]
        : cart.filter((_, idx) => selectedCartIndexes.includes(idx));
    setCheckoutItems(itemsToBuy);
    setIsCartOpen(false);
    setIsCheckout(true);
  };

  const mobileNavLinks = [
    { name: "THE FRESH DROP", href: "/collections/the-fresh-drop", collection: "freshdrop" },
    { name: "MEN", href: "/collections/men", collection: "men" },
    { name: "WOMEN", href: "/collections/women", collection: "women" },
    { name: "SMART WATCHES", href: "/collections/smart-watches", collection: "smart" },
    { name: "FOR COUPLES", href: "/collections/for-couples", collection: "couples" },
    { name: "TRACK ORDER", href: "/collections/track-order" },
    { name: "CONTACT US", href: "https://wa.me/923186643032" },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-black font-jakarta text-white antialiased">
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}} />

      {/* FLOATING GLASS NAVIGATION DOCK */}
      <FloatingDock
        session={session}
        cartCount={cart.length}
        isMounted={isMounted}
        scrolled={scrolled}
        onCart={() => setIsCartOpen(true)}
        onSearch={() => setIsSearchOpen(true)}
        onMenu={() => setIsMobileMenuOpen(true)}
        currentCollection={currentCollection}
        onCollectionChange={setCurrentCollection}
        hidden={isFilterStuck}
      />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-white/[0.07] bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="pointer-events-none absolute left-1/2 top-[-20rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[#DCAA4A]/[0.16] blur-[150px]" />
        <div className="pointer-events-none absolute bottom-[-16rem] right-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[#DCAA4A]/[0.07] blur-[140px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:90px_90px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-32 text-center sm:pt-36 md:pt-40 lg:pb-28 lg:pt-44">
          <motion.p
            key={currentCollection + "-subtitle"}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-sm font-extrabold uppercase tracking-[0.4em] text-[#DCAA4A]"
          >
            {hero.subtitle}
          </motion.p>

          <motion.h1
            key={currentCollection + "-title"}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 md:mt-7 text-4xl sm:text-5xl md:text-6xl lg:text-[72px] xl:text-[80px] font-extrabold uppercase leading-[1.05] tracking-[-0.01em] text-white"
          >
            {hero.title.split(" ").map((word, i) =>
              i === 0 ? word : <span key={i} className="mt-2 block bg-gradient-to-r from-[#DCAA4A] via-[#f5dca4] to-[#DCAA4A] bg-clip-text text-transparent">{word}</span>
            )}
          </motion.h1>

          <motion.p
            key={currentCollection + "-desc"}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mx-auto mt-6 md:mt-8 max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-relaxed text-neutral-300"
          >
            {hero.description}
          </motion.p>

          <motion.div
            key={currentCollection + "-badges"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8 md:mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3"
          >
            {hero.badges.map((b) => (
              <span
                key={b}
                className="rounded-full border border-[#DCAA4A]/30 bg-white/[0.04] px-4 py-2 sm:px-6 sm:py-3 text-[11px] sm:text-[12px] md:text-[13px] font-extrabold uppercase tracking-[0.14em] text-neutral-200 backdrop-blur"
              >
                {b}
              </span>
            ))}
          </motion.div>

          <motion.div
            key={currentCollection + "-stats"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mx-auto mt-12 md:mt-14 grid max-w-3xl grid-cols-2 gap-5 sm:gap-6 border-t border-white/10 pt-8 md:pt-10 sm:grid-cols-4"
          >
            {hero.stats.map((s) => (
              <div key={s.k}>
                <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#DCAA4A]">{s.v}</p>
                <p className="mt-1 md:mt-1.5 text-[11px] sm:text-[12px] md:text-[13px] font-extrabold uppercase tracking-[0.18em] text-neutral-500">
                  {s.k}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FILTER SENTINEL FOR STICKY DETECTION */}
      <div ref={filterSentinelRef} className="h-0 w-full" aria-hidden="true" />

      {/* STICKY FILTER BAR */}
      <div className={`sticky top-0 z-40 border-b border-white/[0.08] bg-black/85 backdrop-blur-xl transition-[top] duration-300 ${isFilterStuck ? "lg:top-0" : "lg:top-[104px]"}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <LayoutGroup id="collection-filters">
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((cat) => {
                const active = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`relative shrink-0 cursor-pointer rounded-full px-4 py-2 sm:px-5 sm:py-3 text-[11px] sm:text-[12px] md:text-[13px] lg:text-sm font-extrabold uppercase tracking-[0.13em] transition-colors duration-300 ${
                      active ? "text-black" : "text-neutral-400 hover:text-[#DCAA4A]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="filter-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-[#DCAA4A]"
                      />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <motion.span
              key={visibleWatches.length}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="whitespace-nowrap text-[11px] sm:text-[12px] md:text-[13px] lg:text-sm font-extrabold uppercase tracking-[0.15em] text-neutral-400"
            >
              {visibleWatches.length} Timepieces
            </motion.span>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
                className="cursor-pointer appearance-none rounded-full border border-white/15 bg-[#0a0a0a] py-2 sm:py-3 pl-4 pr-10 sm:pl-5 sm:pr-11 text-[11px] sm:text-[12px] md:text-[13px] lg:text-sm font-extrabold uppercase tracking-[0.1em] text-neutral-200 outline-none transition-colors hover:border-[#DCAA4A]/50 focus:border-[#DCAA4A]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#0a0a0a]">
                    {o.label}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-3 sm:right-4 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 fill-[#DCAA4A]">
                <path d="M5 7l5 6 5-6H5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC PRODUCT GRID */}
      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <motion.div layout className="grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {visibleWatches.map((watch, i) => (
              <ProductCard
                key={watch.id || i}
                watch={watch}
                index={i}
                inCart={cartIds.has(watch.id)}
                onAdd={handleAddToCart}
                onQuickView={setSelectedWatch}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {visibleWatches.length === 0 && (
          <p className="py-24 text-center text-base sm:text-lg md:text-xl font-extrabold uppercase tracking-[0.16em] text-neutral-600">
            No timepieces found in this category yet.
          </p>
        )}
      </section>

      {/* EDITORIAL BANNER */}
      <section className="relative overflow-hidden border-y border-white/[0.08] bg-[#050505]">
        <div className="pointer-events-none absolute left-1/3 top-1/2 h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-[#DCAA4A]/[0.1] blur-[140px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 sm:gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-28">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-sm font-extrabold uppercase tracking-[0.38em] text-[#DCAA4A]">
              The Maison
            </p>
            <h2 className="mt-4 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-[56px] xl:text-6xl font-extrabold uppercase leading-[1.05] tracking-tight text-white">
              Architects <span className="text-[#DCAA4A]">of Time</span>
            </h2>
            <p className="mt-5 sm:mt-7 max-w-xl text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-relaxed text-neutral-300">
              Two hundred and eleven components. Fourteen hands. One case that takes nine days to
              finish before it earns the right to carry our mark. We compose watches, then test every
              single one twice before it leaves the vault.
            </p>

            <Link href="/collections/the-fresh-drop">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 sm:mt-10 cursor-pointer rounded-full bg-[#DCAA4A] px-8 py-3.5 sm:px-10 sm:py-4 text-[12px] sm:text-sm md:text-[15px] font-extrabold uppercase tracking-[0.2em] text-black transition-shadow hover:shadow-[0_0_50px_-8px_#DCAA4A]"
              >
                Discover The Craft
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-br from-[#171717] to-black"
          >
            <img
              src="/watches.jpg"
              alt="Watchmaker assembling a movement"
              className="h-full w-full object-cover opacity-85 transition-transform duration-[1200ms] hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <span className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7 text-[11px] sm:text-[12px] md:text-[13px] font-extrabold uppercase tracking-[0.18em] text-neutral-200">
              Est. 1954 — Hand-Finished In House
            </span>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative overflow-hidden bg-black px-5 pb-32 pt-16 sm:px-8 lg:px-16 lg:pb-12">
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-[220px] w-[820px] -translate-x-1/2 rounded-full bg-[#DCAA4A]/[0.06] blur-[130px]" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 border-b border-neutral-900 pb-10 sm:pb-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4 sm:space-y-5 lg:col-span-2">
              <Image src={wLogo} alt="Elegance On Your Wrist" className="h-12 sm:h-14 w-auto object-contain" />
              <p className="text-[12px] sm:text-[13px] md:text-sm font-extrabold uppercase tracking-[0.2em] text-[#DCAA4A]">
                Elegance On Your Wrist
              </p>
              <p className="max-w-md text-sm sm:text-base md:text-lg font-medium leading-relaxed text-neutral-400">
                A Pakistani watch house curating automatic, chronograph and smart timepieces for
                people who treat time as an heirloom.
              </p>
              <div className="space-y-2 pt-1 text-sm sm:text-base md:text-lg font-bold text-neutral-300">
                <a href="tel:+923186643032" className="block transition-colors hover:text-[#DCAA4A]">
                  +92 318 664 3032
                </a>
                <a href="mailto:care@eleganceonyourwrist.pk" className="block transition-colors hover:text-[#DCAA4A]">
                  care@eleganceonyourwrist.pk
                </a>
              </div>
            </div>

            {[
              {
                heading: "Shop",
                links: [
                  { label: "Fresh Drop", href: "/collections/the-fresh-drop" },
                  { label: "Men", href: "/collections/men" },
                  { label: "Women", href: "/collections/women" },
                  { label: "Smart Watches", href: "/collections/smart-watches" },
                  { label: "For Couples", href: "/collections/for-couples" },
                ],
              },
              {
                heading: "Help",
                links: [
                  { label: "Track Order", href: "/collections/track-order" },
                  { label: "Shipping & Delivery", href: "/pages/shipping" },
                  { label: "Returns & Exchange", href: "/pages/returns" },
                  { label: "Warranty Claim", href: "/pages/warranty" },
                  { label: "Contact Us", href: "https://wa.me/923186643032" },
                ],
              },
            ].map((col) => (
              <div key={col.heading} className="space-y-3 sm:space-y-4">
                <h4 className="text-[12px] sm:text-[13px] md:text-sm font-extrabold uppercase tracking-[0.2em] text-[#DCAA4A]">
                  {col.heading}
                </h4>
                <ul className="space-y-2.5 sm:space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        target={l.href.startsWith("http") ? "_blank" : undefined}
                        rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-sm sm:text-base md:text-lg font-bold text-neutral-400 transition-colors hover:text-[#DCAA4A]"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-5 pt-6 sm:pt-8 md:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {Object.keys(PAYMENT_DATA).map((p) => (
                <span
                  key={p}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] md:text-[12px] font-extrabold uppercase tracking-[0.14em] text-neutral-300"
                >
                  {p}
                </span>
              ))}
            </div>
            <p className="text-[12px] sm:text-[13px] md:text-sm font-bold text-neutral-600">
              © {new Date().getFullYear()} Elegance On Your Wrist.
            </p>
          </div>
        </div>
      </footer>

      {/* SEARCH MODAL */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] flex flex-col justify-start bg-black/90 px-4 sm:px-5 pt-20 sm:pt-24 backdrop-blur-md"
          >
            <div className="absolute inset-0 -z-10" onClick={() => setIsSearchOpen(false)} />

            <motion.div
              initial={{ y: -40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="relative mx-auto w-full max-w-3xl rounded-3xl border border-[#DCAA4A]/20 bg-[#0a0a0a] p-5 sm:p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4 border-b border-neutral-800 pb-3 sm:pb-4">
                <div className="flex w-full items-center gap-3 sm:gap-4">
                  <IconSearch className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-[#DCAA4A]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search timepieces..."
                    className="w-full bg-transparent text-base sm:text-lg md:text-2xl font-bold text-white placeholder-neutral-600 focus:outline-none"
                  />
                </div>
                <button onClick={() => setIsSearchOpen(false)} aria-label="Close search" className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
                  <IconClose className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="mt-5 sm:mt-6">
                <span className="mb-2.5 sm:mb-3 block text-[11px] sm:text-[12px] md:text-[13px] font-extrabold uppercase tracking-[0.22em] text-neutral-500">
                  Popular Searches
                </span>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {["Chronograph", "Automatic", "Steel Edition", "Leather Strap", "Gold PVD"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setActiveCategory(CATEGORIES.includes(tag) ? tag : activeCategory);
                        if (searchInputRef.current) searchInputRef.current.value = tag;
                      }}
                      className="cursor-pointer rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 sm:px-5 sm:py-2.5 text-[12px] sm:text-[13px] md:text-sm font-extrabold uppercase tracking-[0.1em] text-neutral-300 transition-all hover:bg-[#DCAA4A] hover:text-black"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] md:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-neutral-950 border-r border-amber-500/20 z-[75] shadow-[20px_0_50px_rgba(0,0,0,0.8)] flex flex-col md:hidden overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="p-5 border-b border-neutral-900 flex items-center justify-between relative z-10 bg-neutral-950/50">
                <div className="flex items-center">
                  {session ? (
                    <div className="flex items-center gap-3">
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full border border-amber-500/50 object-cover shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-amber-100 uppercase tracking-normal truncate max-w-[120px]">
                          {session.user.name}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => signIn("google")}
                      className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Sign In
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 p-1.5 rounded-full transition-all duration-300 focus:outline-none cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 relative z-10 [scrollbar-width:none]">
                <span className="text-[10px] font-bold text-neutral-600 tracking-[0.25em] uppercase block mb-4 ml-2">
                  Menu Collections
                </span>

                <div className="flex flex-col gap-1">
                  {mobileNavLinks.map((link, idx) => {
                    const active = link.collection && link.collection === currentCollection;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                      >
                       <Link
  href={link.href}
  onClick={(e) => {
    if (link.collection) {
      e.preventDefault();
      // ⚡ Mobile par bhi click karte hi URL foran change hoga:
      window.history.pushState(null, "", link.href);
      setCurrentCollection(link.collection);
      setIsMobileMenuOpen(false);
    }
  }}
  target={link.href?.startsWith("http") ? "_blank" : undefined}
  rel={link.href?.startsWith("http") ? "noopener noreferrer" : undefined}
  className={`group flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-neutral-900 border border-transparent hover:border-amber-500/20 transition-all duration-300 ${
    active ? "border-amber-500/20 bg-neutral-900" : ""
  }`}
>
                          <span className={`text-[13px] font-bold tracking-widest uppercase transition-colors ${
                            active ? "text-amber-400" : "text-neutral-300 group-hover:text-amber-400"
                          }`}>
                            {link.name}
                          </span>
                          <svg
                            className="w-4 h-4 text-neutral-700 group-hover:text-amber-500 transition-all transform group-hover:translate-x-1 duration-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-neutral-900 relative z-10 bg-neutral-950">
                <div className="flex items-center justify-center">
                  <Image src={wLogo} preload width={40} height={40} alt="Logo" className="opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                </div>
                <p className="text-center text-[9px] text-amber-500/50 uppercase tracking-[0.25em] mt-3 font-semibold">
                  Elegance On Your Wrist
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* SHOPPING CART DRAWER */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[85] transition-opacity duration-300 ${
          isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] max-w-full bg-neutral-950 border-l border-neutral-800 z-[86] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col font-jakarta ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 sm:p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase">Shopping Cart</h2>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-mono font-bold">
              ({cart.length})
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-neutral-900 transition-colors cursor-pointer"
            aria-label="Close Cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-3xl shadow-inner">
                👜
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-semibold text-white tracking-wide">Your cart is empty</h3>
                <p className="text-xs sm:text-sm text-gray-400 max-w-[240px]">
                  Explore our luxury watch collections and add your favorite items.
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-2 bg-white text-black font-semibold text-xs sm:text-sm py-3 px-8 rounded hover:bg-neutral-200 transition-colors uppercase tracking-wider shadow-lg hover:scale-105 transition-transform cursor-pointer"
              >
                Explore Collections
              </button>
            </div>
          ) : (
            <div className="space-y-4">
  {cart.map((item, idx) => (
    <div key={idx} className="flex items-center gap-3 bg-neutral-900/60 border border-amber-500/20 p-3 rounded-2xl">
      <input
        type="checkbox"
        checked={selectedCartIndexes.includes(idx)}
        onChange={() => handleToggleCartSelect(idx)}
        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
        title="Select for checkout"
      />
      <img src={item.image} alt={item.title} className="w-14 h-14 object-contain bg-neutral-950 rounded-xl p-1 border border-neutral-800" />
      
      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-amber-100 truncate">{item.title}</h4>
        <p className="text-xs font-bold text-[#DCAA4A] mt-0.5">{item.price}</p>

        {/* 🟢 [- 1 +] Quantity Selector */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center border border-neutral-800 bg-black rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => handleUpdateQuantity(idx, -1)}
              className="w-7 h-6 flex items-center justify-center text-xs text-neutral-400 hover:bg-neutral-800 hover:text-amber-400 font-bold cursor-pointer"
            >
              −
            </button>
            <span className="w-8 text-center text-xs font-bold text-white font-mono">
              {item.quantity || 1}
            </span>
            <button
              type="button"
              onClick={() => handleUpdateQuantity(idx, 1)}
              disabled={(item.quantity || 1) >= (item.stock ?? 99)}
              className="w-7 h-6 flex items-center justify-center text-xs text-neutral-400 hover:bg-neutral-800 hover:text-amber-400 font-bold cursor-pointer disabled:opacity-30"
            >
              +
            </button>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            Stock: {item.stock ?? 10}
          </span>
        </div>
      </div>

      <button
        onClick={() => handleRemoveFromCart(idx)}
        className="text-neutral-500 hover:text-red-400 text-sm p-1.5 cursor-pointer transition-colors"
      >
        ✕
      </button>
    </div>
  ))}
</div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-900 text-center">
          {cart.length > 0 ? (
            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs sm:text-sm tracking-widest uppercase rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all cursor-pointer"
            >
              Proceed to Checkout
            </button>
          ) : (
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest">
              100% Authentic Luxury Timepieces
            </p>
          )}
        </div>
      </aside>

      {/* QUICK VIEW & CHECKOUT MODAL */}
      <AnimatePresence>
        {(selectedWatch || isCheckout) && (
          <div className="fixed inset-0 z-[100] font-jakarta">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ willChange: "opacity" }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            />

            <div 
              className="fixed inset-0 overflow-y-auto"
              onClick={() => {
                setSelectedWatch(null);
                setIsCheckout(false);
                setCheckoutItems([]);
              }}
            >
              <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
                <motion.div
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  style={{ willChange: "transform, opacity" }}
                  className="relative w-full max-w-4xl bg-neutral-950/90 border border-amber-500/30 rounded-3xl p-6 md:p-10 shadow-[0_0_60px_rgba(245,158,11,0.15)] backdrop-blur-xl z-10 overflow-hidden"
                >
                  <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none transform-gpu" />
                  <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none transform-gpu" />

                  {!isCheckout && (
                    <button
                      onClick={() => {
                        setSelectedWatch(null);
                        setIsCheckout(false);
                        setScreenshotName("");
                      }}
                      className="absolute top-5 right-5 w-10 h-10 rounded-full bg-neutral-900 border border-amber-500/20 text-neutral-400 hover:text-amber-400 hover:border-amber-400 transition-all flex items-center justify-center text-lg z-20 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Left Column: Watch Image / Order Summary Display */}
                    <div className="relative flex flex-col justify-start min-h-[280px] max-h-[380px] overflow-y-auto bg-neutral-900/50 rounded-2xl p-4 border border-zinc-800/80 watch-box-scroll">
                      <div className="absolute w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none self-center transform-gpu" />

                      {isCheckout && checkoutItems.length > 0 ? (
                        <div className="space-y-3 relative z-10 w-full pr-1">
                          <h4 className="text-xs sm:text-sm font-medium tracking-widest text-amber-400 uppercase mb-2 border-b border-amber-500/20 pb-1">
                            Order Summary ({checkoutItems.length} Items)
                          </h4>
                          {checkoutItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-3 bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
                              <img
                                src={item.image} 
                                alt={item.title} 
                                className="w-12 h-12 object-contain bg-neutral-900 rounded-lg p-1" 
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] sm:text-[15px] font-bold text-amber-100 truncate">{item.title}</p>
                                <p className="text-xs sm:text-sm text-amber-400 font-semibold mt-1">{item.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        selectedWatch && (
                          <div className="flex flex-col items-center justify-center h-full w-full relative min-h-[250px] md:min-h-[320px]">
                            <motion.div
                              initial={{ scale: 0.85, rotate: -3 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              style={{ willChange: "transform" }}
                              className="relative w-full h-full min-h-[250px] md:min-h-[320px]"
                            >
                              <img
                                src={selectedWatch.image}
                                alt={selectedWatch.title}
                                className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)]"
                              />
                            </motion.div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Right Column: Details or Checkout */}
                    <div className="flex flex-col justify-between">
                      {!isCheckout ? (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          style={{ willChange: "transform, opacity" }}
                        >
                          <span className="text-[10px] sm:text-[11px] tracking-[0.3em] font-medium text-amber-500 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block mb-3">
                            {selectedWatch?.spec || "SWISS PRECISION MOVEMENT"}
                          </span>

                          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-amber-100 tracking-wider uppercase mb-2">
                            {selectedWatch?.title}
                          </h2>

                          <div className="mt-3 sm:mt-4 flex flex-wrap items-end gap-2 sm:gap-3 mb-4">
                            <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-amber-400 tracking-wide drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                              {selectedWatch?.price}
                            </p>
                            {selectedWatch?.original && (
                              <p className="pb-0.5 sm:pb-1 text-sm sm:text-base font-bold text-neutral-600 line-through">
                                {selectedWatch?.original}
                              </p>
                            )}
                          </div>

                          <p className="text-neutral-400 text-xs sm:text-sm md:text-[15px] leading-relaxed mb-6 border-t border-b border-neutral-800 py-4">
                            {selectedWatch?.description}
                          </p>

                          {/* 🟢 Action Buttons with Live Stock Validation */}
                          {(() => {
                            const isOut = (selectedWatch?.stock ?? 0) <= 0;
                            return (
                              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                <button
                                  type="button"
                                  disabled={isOut}
                                  onClick={() => handleAddToCart(selectedWatch)}
                                  className={`flex-1 py-3.5 px-6 rounded-full border font-medium text-xs sm:text-[0.8rem] tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-3 whitespace-nowrap ${
                                    isOut
                                      ? "border-neutral-800 bg-neutral-900 text-neutral-500 cursor-not-allowed"
                                      : "border-amber-500/50 bg-neutral-900 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer"
                                  }`}
                                >
                                  <Image
                                   className="w-5 brightness-0 invert h-5"
                                   src="/cart.png"
                                   alt=""
                                   width={20}
                                   height={20}
                                   priority
                                   />
                                  {isOut ? "Out of Stock" : "Add To Cart"}
                                </button>

                                <button
                                  type="button"
                                  disabled={isOut}
                                  onClick={() => {
                                    setCheckoutItems([selectedWatch]);
                                    setIsCheckout(true);
                                  }}
                                  className={`flex-1 py-3.5 px-6 rounded-full font-bold text-xs sm:text-[0.8rem] tracking-widest uppercase transition-all duration-200 ${
                                    isOut
                                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                      : "bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] cursor-pointer"
                                  }`}
                                >
                                  {isOut ? "Unavailable" : "Buy Now"}
                                </button>
                              </div>
                            );
                          })()}


                        </motion.div>
                      ) : (
                        <motion.form
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          style={{ willChange: "transform, opacity" }}
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (loading) return;
                            setErrorMessage("");

                            const name = e.target.name?.value.trim() || "";
                            const phone = e.target.phone?.value.trim() || "";
                            const address = e.target.address?.value.trim() || "";

                            if (!name) return setErrorMessage("Please enter your name.");
                            if (!phone) return setErrorMessage("Please enter your phone number.");
                            if (!address) return setErrorMessage("Please enter your shipping address.");
                            if (!screenshotBase64) return setErrorMessage("Please upload your payment screenshot.");

                            setLoading(true);

                           const formData = {
  name,
  phone,
  email: e.target.email?.value.trim() || "",
  address,
  paymentMethod,
  // Format: "SADIA (Qty: 2), DFDG (Qty: 1)"
  watchTitle: checkoutItems.map((item) => `${item.title} (Qty: ${item.quantity || 1})`).join(", "),
  watchPrice: calculateTotal(checkoutItems),
  // 🟢 API ko har item ki ID aur quantity pass karein:
  items: checkoutItems.map((item) => ({
    id: item.id || item._id,
    quantity: item.quantity || 1,
    title: item.title,
    price: item.price,
  })),
  screenshotName: screenshotName || "",
  screenshotBase64: screenshotBase64 || "",
};

                            try {
                              const res = await fetch("/api/checkout", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(formData),
                              });

                              const data = await res.json();

                              if (data.success) {
                                setOrderSuccess(true);
                                setTimeout(() => {
                                  setOrderSuccess(false);
                                  setSelectedWatch(null);
                                  setIsCheckout(false);
                                  setCheckoutItems([]);
                                  setScreenshotName("");
                                  setScreenshotBase64("");
                                }, 5000);
                              } else {
                                setErrorMessage(data.message || "Order didn't submit");
                              }
                            } catch (err) {
                              setErrorMessage("Network error! Check your connection.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="space-y-3"
                        >
                          {orderSuccess && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs sm:text-sm text-center font-semibold flex items-center justify-center gap-2"
                            >
                              <span>✓</span> Order Successful! Thank you for your purchase.
                            </motion.div>
                          )}

                          {errorMessage && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-red-500/20 border border-red-500/50 text-red-300 p-2.5 rounded-xl text-xs sm:text-sm text-center font-semibold flex items-center justify-center gap-4"
                            >
                              <span className="text-[15px]">⚠️</span> {errorMessage}
                            </motion.div>
                          )}

                          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                            <h3 className="text-sm sm:text-base font-extrabold text-amber-300 tracking-wider uppercase">
                              Checkout
                            </h3>
                            <button
                              type="button"
                              onClick={() => setIsCheckout(false)}
                              className="text-xs sm:text-sm text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              ← Back
                            </button>
                          </div>

                          <div>
                            <label className="block text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mb-1">
                              Full Name
                            </label>
                            <input
                              required
                              name="name"
                              type="text"
                              placeholder="Muhammad Haris"
                              className="w-full bg-neutral-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-amber-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 font-jakarta"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mb-1">
                                WhatsApp / Mobile Number
                              </label>
                              <input
                                required
                                name="phone"
                                type="tel"
                                placeholder="0300 1234567"
                                className="w-full bg-neutral-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-amber-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 font-jakarta"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mb-1">
                                Email Address
                              </label>
                              <input
                                required
                                name="email"
                                type="email"
                                placeholder="Enter Your Email"
                                className="w-full bg-neutral-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-amber-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 font-jakarta"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mb-1">
                              Shipping Address (House #, Street, City)
                            </label>
                            <input
                              required
                              name="address"
                              type="text"
                              placeholder="House #123, Street 5, Phase 4, Lahore"
                              className="w-full bg-neutral-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-amber-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 font-jakarta"
                            />
                          </div>

                          {/* Dynamic Payment Selection */}
                          <div className="bg-neutral-950/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 my-3 shadow-[0_0_25px_rgba(245,158,11,0.08)]">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                              <span className="text-[11px] sm:text-[12px] font-medium text-amber-400 tracking-[0.2em] uppercase">
                                Step 1 — Send Payment
                              </span>
                              <span className="text-xs sm:block hidden font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                                {calculateTotal(checkoutItems)}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-neutral-900/80 p-1.5 rounded-xl border border-neutral-800">
                              {["EASYPAISA", "JAZZCASH"].map((method) => {
                                const isSelected = paymentMethod === method;
                                return (
                                  <button
                                    key={method}
                                    type="button"
                                    onClick={() => setPaymentMethod(method)}
                                    className={`relative py-1 px-2 rounded-lg font-medium text-[11px] sm:text-xs tracking-wider transition-all duration-300 cursor-pointer overflow-hidden ${
                                      isSelected
                                        ? "text-amber-300 border border-amber-400/70 bg-gradient-to-b from-amber-500/20 to-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                                        : "text-neutral-400 hover:text-neutral-200 border border-transparent hover:bg-neutral-800/60"
                                    }`}
                                  >
                                    <span className="relative z-10">{method}</span>
                                    {isSelected && (
                                      <motion.div
                                        layoutId="glowIndicator"
                                        className="absolute inset-0 bg-amber-400/10 rounded-lg pointer-events-none"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            <AnimatePresence mode="wait">
                              <motion.div
                                key={paymentMethod}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-3 pt-1"
                              >
                                <div className="flex items-center justify-between bg-neutral-900/90 border border-amber-500/20 rounded-xl p-2 hover:border-amber-500/40 transition-all group">
                                  <div>
                                    <span className="block text-[11px] sm:text-xs font-medium text-neutral-400 tracking-wider uppercase mb-1">
                                      {PAYMENT_DATA[paymentMethod].label}
                                    </span>
                                    <span className="text-[13px] sm:text-sm font-bold text-[#DCAA4A] drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] tracking-wider">
                                      {PAYMENT_DATA[paymentMethod].number}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(PAYMENT_DATA[paymentMethod].number);
                                      setCopiedField("number");
                                      setTimeout(() => setCopiedField(null), 2000);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-neutral-950/80 text-amber-300 hover:text-white hover:border-amber-400 hover:bg-amber-500/20 text-[11px] font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                                  >
                                    📋 {copiedField === "number" ? "Copied!" : "Copy"}
                                  </button>
                                </div>

                                <div className="flex items-center justify-between bg-neutral-900/90 border border-amber-500/20 rounded-xl p-2 hover:border-amber-500/40 transition-all group">
                                  <div>
                                    <span className="block text-[11px] sm:text-xs font-medium text-neutral-400 tracking-wider uppercase">
                                      ACCOUNT TITLE
                                    </span>
                                    <span className="text-[13px] sm:text-sm font-bold text-[#DCAA4A] drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] tracking-wider">
                                      {PAYMENT_DATA[paymentMethod].accountTitle}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(PAYMENT_DATA[paymentMethod].accountTitle);
                                      setCopiedField("title");
                                      setTimeout(() => setCopiedField(null), 2000);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-neutral-950/80 text-amber-300 hover:text-white hover:border-amber-400 hover:bg-amber-500/20 text-[11px] font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                                  >
                                    📋 {copiedField === "title" ? "Copied!" : "Copy"}
                                  </button>
                                </div>

                                <p className="text-[12px] sm:text-[13px] font-medium text-neutral-400 pt-1 tracking-wide">
                                  {PAYMENT_DATA[paymentMethod].instruction}
                                </p>
                              </motion.div>
                            </AnimatePresence>
                          </div>

                          <div className="bg-neutral-900/70 border border-amber-500/20 rounded-xl p-3 space-y-2 mt-2">
                            <label className="relative flex flex-col items-center justify-center border border-dashed border-amber-500/40 rounded-lg p-3 sm:p-4 bg-neutral-950/60 cursor-pointer hover:border-amber-400 transition-all">
                              <span className="text-[11px] sm:text-[12px] text-neutral-300 font-medium flex items-center">
                                📷 {screenshotName ? screenshotName : "Upload Payment Receipt / Screenshot"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files && e.target.files[0];
                                  if (file) {
                                    setScreenshotName(file.name);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setScreenshotBase64(reader.result);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <motion.button
                            type="submit"
                            disabled={loading || orderSuccess}
                            whileHover={!loading ? { scale: 1.01 } : {}}
                            whileTap={!loading ? { scale: 0.98 } : {}}
                            className={`w-full mt-3 py-3 sm:py-3.5 rounded-full text-neutral-950 font-bold text-xs sm:text-sm tracking-widest uppercase transition-all ${
                              loading || orderSuccess
                                ? "bg-amber-600/60 opacity-70 cursor-not-allowed"
                                : "bg-gradient-to-r from-amber-500 to-amber-600 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] cursor-pointer"
                            }`}
                          >
                            {loading ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-neutral-950" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                                Processing Order...
                              </span>
                            ) : (
                              `Confirm Order • ${calculateTotal(checkoutItems)}`
                            )}
                          </motion.button>
                        </motion.form>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}