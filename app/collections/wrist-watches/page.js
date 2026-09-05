"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import wLogo from "@/public/wLogo.png"

export default function WristWatchesPage() {
  const router = useRouter();
  // slider usestate
  const [index, setIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // States for Checkout and Selection
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [selectedCartIndexes, setSelectedCartIndexes] = useState([]); // Cart checkbox index tracker
  const [checkoutItems, setCheckoutItems] = useState([]); // Items going to payment/checkout

  const [isCheckout, setIsCheckout] = useState(false); // Form screen toggler
  const [screenshotName, setScreenshotName] = useState(""); // Uploaded file name tracker
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("JAZZCASH");
  const [copiedField, setCopiedField] = useState(null);


  const { data: session, status } = useSession();
  const [cart, setCart] = useState([])

  const sliderRef = useRef(null);
  const isInitialSync = useRef(true);



  // Payment details structure
  const paymentData = {
    JAZZCASH: {
      label: "JAZZCASH NUMBER",
      number: "0300 1234567",
      accountTitle: "Muhammad Haris",
      instruction: "Send via JazzCash app or any Jazz franchise.",
    },
    EASYPAISA: {
      label: "EASYPAISA NUMBER",
      number: "0318 6643032",
      accountTitle: "Muhammad Haris",
      instruction: "Send via EasyPaisa app or any EasyPaisa agent.",
    },
    "BANK TRANSFER": {
      label: "ACCOUNT / IBAN NUMBER",
      number: "PK36 MEZN 0001 2345 6789 01",
      accountTitle: "Muhammad Haris Sakhi",
      instruction: "Transfer via any mobile banking app or ATM (Meezan Bank).",
    },
  };


  // 1. Session change hone par (Login/Logout) Cart Sync karein
  useEffect(() => {
    setIsMounted(true);

    const syncOnAuthChange = async () => {
      if (status === "loading") return;

      if (session?.user) {
        // Login hone par initial sync start karein (Auto-save block)
        isInitialSync.current = true;

        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              const dbCart = data.cart || [];
              // Database se original cart load karein
              setCart(dbCart);
              localStorage.setItem("my_store_cart", JSON.stringify(dbCart));
            }
          }
        } catch (err) {
          console.error("Cart fetch error:", err);
        } finally {
          // Sync complete! Ab user ke manual changes save ho sakenge
          isInitialSync.current = false;
        }
      } else {
        // Logout hone par guest local cart load karein
        const localCart = JSON.parse(localStorage.getItem("my_store_cart") || "[]");
        setCart(localCart);
        isInitialSync.current = false;
      }
    };

    syncOnAuthChange();
  }, [session, status]);

  // 2. Sirf tab DB save chale jab User manually cart mein koi item add/remove kare
  useEffect(() => {
    if (!isMounted || isInitialSync.current) return;

    // LocalStorage update
    localStorage.setItem("my_store_cart", JSON.stringify(cart));

    // Agar Logged in user hai to DB update karein
    if (session?.user) {
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart }),
      }).catch((err) => console.error("Database update error:", err));
    }
  }, [cart]); // Note: Yahan 'ses



  // Price string to number helper ("PKR 210,000" -> 210000)
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    return Number(priceStr.replace(/[^0-9]/g, "")) || 0;
  };

  // Total price calculation helper
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + parsePrice(item.price), 0);
    return `PKR ${total.toLocaleString()}`;
  };

  // Slider animation
  const slides = [
    "UPTO 30% OFF | SALE IS NOW LIVE",
    "✓ Free Nationwide Shipping | 7-Day Easy Returns | 1 Year Warranty",
  ];

  // Mobile Detection
  useLayoutEffect(() => {
    const userAgent = navigator.userAgent || window.opera;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (isMobileDevice) {
      router.push('/collections/wrist-watches');
    }
  }, [router]);

  // Click handler
  const handleToggle = () => {
    setIndex((prev) => (prev === 0 ? 1 : 0));
  };

  // Auto-Loop
  useEffect(() => {
    const timer = setInterval(() => {
      handleToggle();
    }, 4000);

    return () => clearInterval(timer);
  }, [index]);

  // Menu bar 
  const navLinks = [
    { name: "NEW ARRIVAL", href: "./new-arrival" },
    { name: "MEN", href: "./men" },
    { name: "WOMEN", href: "./women" },
    { name: "SMART WATCHES", href: "./smart-watches" },
    { name: "FOR COUPLES", href: "./for-couples" },
    { name: "TRACK ORDER", href: "./track-order" },
    { name: "CONTACT US", href: "https://wa.me/923186643032" },
  ];

  // Search Bar
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);

      const handleKeyDown = (e) => {
        if (e.key === "Escape") setIsSearchOpen(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isSearchOpen]);

  // Cart open / Close keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsCartOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const heroImages = [
    "/watches.jpg",
    "https://en-pk.svestonwatches.com/cdn/shop/files/Ghulam_Nabi-01.jpg?v=1781451151&width=2400",
  ];

  useEffect(() => {
    if (!heroImages.length) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const handleDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -60 || velocity < -300) {
      if (currentIndex < heroImages.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setCurrentIndex(0);
      }
    } else if (offset > 60 || velocity > 300) {
      if (currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else {
        setCurrentIndex(heroImages.length - 1);
      }
    }
  };

  const watches = [
    {
      id: 1,
      title: 'REFINE GMT MASTER',
      price: 'PKR 185,000',
      spec: 'SWISS PRECISION MOVEMENT',
      image: '/wClassic.png',
    },
    {
      id: 2,
      title: 'CLASSIC SKELETON',
      price: 'PKR 210,000',
      spec: 'SAPPHIRE CRYSTAL',
      image: '/wClassic.png',
    },
    {
      id: 3,
      title: 'PILOT CHRONOGRAPH',
      price: 'PKR 195,000',
      spec: 'TACHYMETER SCALE',
      image: '/wClassic.png',
    },
    {
      id: 4,
      title: 'MINIMALIST ROSE GOLD',
      price: 'PKR 180,000',
      spec: 'AUTOMATIC CALIBER',
      image: '/wClassic.png',
    },
  ];

  // Add to cart option
  const handleAddToCart = (watch) => {
    setCart((prev) => [...prev, watch]);
    setSelectedWatch(null);
    setIsCheckout(false);
    setScreenshotName("");
    setIsCartOpen(true);
  };

  // Cart item selection checkbox toggle
  const handleToggleCartSelect = (indexToToggle) => {
    setSelectedCartIndexes((prev) =>
      prev.includes(indexToToggle)
        ? prev.filter((i) => i !== indexToToggle)
        : [...prev, indexToToggle]
    );
  };

  // Cart se item remove karne ke liye
  const handleRemoveFromCart = (indexToRemove) => {
    setCart((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setSelectedCartIndexes((prev) =>
      prev.filter((i) => i !== indexToRemove).map((i) => (i > indexToRemove ? i - 1 : i))
    );
  };

  // Cart Checkout Proceed Logic
  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;

    let itemsToBuy = [];
    // Binary check: Agar koi tick nahi hai YA saare tick hain -> Saare items checkout honge
    if (selectedCartIndexes.length === 0 || selectedCartIndexes.length === cart.length) {
      itemsToBuy = [...cart];
    } else {
      // Sirf ticked items checkout honge
      itemsToBuy = cart.filter((_, idx) => selectedCartIndexes.includes(idx));
    }

    setCheckoutItems(itemsToBuy);
    setIsCartOpen(false);
    setIsCheckout(true);
  };

  // Footer glow card 
  const cardRef = useRef(null);

  // FAQ Data List
  const [openFaq, setOpenFaq] = useState(false);
  const faqData = [
    {
      q: "Are your watches original and authentic?",
      a: "Yes. Every piece is sourced through authorised distributors and inspected by our watchmaker before dispatch. Each order ships with its brand box, manual and stamped warranty card."
    },
    {
      q: "How long does delivery take across Pakistan?",
      a: "Standard nationwide shipping takes 2 to 4 business days. Tracking details are provided via SMS and WhatsApp as soon as your order is dispatched."
    },
    {
      q: "Do you offer cash on delivery?",
      a: "Yes, Cash on Delivery (COD) is available across all major cities and towns in Pakistan alongside online bank transfer and mobile wallet payments."
    },
    {
      q: "What does the 1 year warranty cover?",
      a: "Our 1-year in-house warranty covers the internal movement mechanism, crown functions, and strap hardware against manufacturing defects."
    },
    {
      q: "Can I return or exchange a watch?",
      a: "We offer a 7-day hassle-free return and exchange policy. The timepiece must be unworn, in its original condition, with all protective films intact."
    },
    {
      q: "Can I get the watch resized or engraved?",
      a: "Yes! Mention your wrist size or engraving preference in the order notes or via WhatsApp, and our watchmakers will customize it before dispatch free of cost."
    }
  ];

  return (
    <div className="w-full min-h-600 text-white flex flex-col relative">
      <nav className="flex anouncement-bar-scroll sticky top-0 z-50 bg-[linear-gradient(to_right,_black_5%,_#9E674F_18%,_#9E674F_80%,_black_94%)] px-16 h-12 w-full justify-center md:space-x-26 items-center">

        {/* Left Arrow */}
        <button onClick={handleToggle} className="arrow hidden md:block cursor-pointer py-[15px] focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" color="#dbdbdb" fill="none" stroke="#dbdbdb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 4L8.66943 10.0405C6.44352 11.6545 6.44353 12.3455 8.66943 13.9595L17 20"></path>
          </svg>
        </button>

        {/* Carousel Container */}
        <div className="relative h-12 w-full md:w-[540px] flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute font-Inter font-bold text-xs sm:text-[14px] w-full text-center md:whitespace-nowrap"
            >
              {slides[index]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Arrow */}
        <button onClick={handleToggle} className="arrow hidden md:block cursor-pointer py-[15px] focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" color="#dbdbdb" fill="none" stroke="#dbdbdb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4L15.3306 10.0405C17.5565 11.6545 17.5565 12.3455 15.3306 13.9595L7 20"></path>
          </svg>
        </button>
      </nav>

      {/* Header Bar */}
      <header
        className={`w-full sticky top-0 z-50 bg-black border-b border-neutral-900 transition-all duration-300 ${isScrolled
          ? "fixed top-0 left-0 right-0 z-50 shadow-2xl animate-in slide-in-from-top"
          : "relative"
          }`}
      >

        <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-10 h-25 flex items-center justify-between gap-2">
          {/* hamburger menu */}

          {/* Mobile Menu Button (Hamburger) */}
          <div className="flex justify-center items-center">

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden hover:opacity-75 cursor-pointer transition-opacity p-1 focus:outline-none text-white"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex mx-1 sm:-mx-5 flex-col items-center md:ml-8">
              <Link href={'/'} className="flex w-12 items-center justify-center">
                <Image
                  src={wLogo}
                  alt="SVESTON Logo"
                  priority
                  className="h-10 sm:h-12 w-auto object-contain transition-transform hover:scale-105"
                />
              </Link>
              <div className="text-[#DCAA4A] hidden sm:flex text-xs font-medium whitespace-nowrap">Elegance On Your Wrist</div>
            </div>
          </div>

          <nav className="flex items-center justify-center flex-wrap gap-x-1 sm:gap-x-2 md:gap-x-3 lg:gap-x-6">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="group relative px-1.5 sm:px-2.5 md:px-3 lg:px-4 py-2 text-[10px] sm:text-xs md:text-[13px] font-medium tracking-wider whitespace-nowrap text-white transition-all duration-300 hover:bg-[#F5F5F0] hover:text-black rounded-sm"
              >
                <span className="font-Inter hidden md:flex font-bold text-[13.5px]">{link.name}</span>
                <span className="absolute bottom-1 left-2 right-2 h-[2px] bg-black scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex-shrink-0 flex items-center space-x-2 sm:space-x-4 lg:space-x-6 text-white">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search"
              className="hover:opacity-75 cursor-pointer transition-opacity p-1 focus:outline-none"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Cart"
              className="hover:opacity-75 cursor-pointer transition-opacity p-1 relative focus:outline-none"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {isMounted && cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#DCAA4A] text-neutral-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Account Button */}
            {/* User Auth Section (Login / Logout / Profile Pic) */}
            {session ? (
              <div className="flex items-center gap-3">
                {/* User Picture */}
                <div className="relative group flex items-center">
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={7}
                    height={7}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-neutral-700 object-cover cursor-pointer"
                  />
                  {/* Tooltip Name */}
                  <div className="absolute top-full right-0 mt-2 bg-neutral-900 border border-neutral-800 text-white text-xs px-2.5 py-1 rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {session.user?.name}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => signOut()}
                  className="hover:opacity-75 cursor-pointer transition-opacity p-1 relative focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#dbdbdb" fill="none" stroke="#dbdbdb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 6C14.4534 4.90658 14.3147 4.20985 13.9025 3.67376C13.7426 3.46574 13.5561 3.27954 13.3476 3.11992C12.5381 2.5 11.363 2.5 9.01286 2.5H8.51184C5.67786 2.5 4.26087 2.5 3.38046 3.37867C2.50006 4.25734 2.50004 5.67157 2.50003 8.49997L2.50002 15.5C2.50001 18.3284 2.5 19.7426 3.38042 20.6213C4.26083 21.5 5.67783 21.5 8.51184 21.5H9.01281C11.363 21.5 12.5381 21.5 13.3476 20.8801C13.556 20.7205 13.7426 20.5343 13.9025 20.3263C14.3147 19.7901 14.4534 19.0933 14.5 17.9996"></path>
                    <path d="M20.5 11.9999H8.50002M18 15.5C18 15.5 21.5 12.9223 21.5 12C21.5 11.0777 18 8.5 18 8.5"></path>
                  </svg>
                </button>
              </div>
            ) : (
              /* Login Button */
              <button
                onClick={() => signIn("google")}
                className="hover:opacity-75 cursor-pointer transition-opacity p-1 relative focus:outline-none"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar Modal */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-start pt-20 px-4"
            >
              <div
                className="absolute inset-0 -z-10"
                onClick={() => setIsSearchOpen(false)}
              />

              <motion.div
                initial={{ y: -40, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="max-w-3xl w-full mx-auto bg-neutral-950 border border-neutral-800 rounded-lg p-4 sm:p-6 shadow-2xl relative"
              >
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div className="flex items-center space-x-3 w-full pr-4">
                    <svg className="w-5 h-5 text-gray-400 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>

                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search watches, collections, couples..."
                      className="w-full bg-transparent text-white text-base sm:text-lg focus:outline-none placeholder-gray-500 font-light"
                    />
                  </div>

                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="text-gray-400 cursor-pointer hover:text-white p-1 rounded-full hover:bg-neutral-800 transition-colors"
                    aria-label="Close Search"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 pt-2">
                  <span className="text-xs text-gray-500 uppercase tracking-widest block mb-2 font-medium">
                    Popular Searches
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {["Chronograph", "Couple Set", "Minimalist Gold", "Smart Series", "New Arrival"].map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (searchInputRef.current) searchInputRef.current.value = tag;
                        }}
                        className="text-xs cursor-pointer bg-neutral-900 hover:bg-white hover:text-black text-gray-300 px-3 py-1.5 rounded-full border border-neutral-800 transition-all duration-200"
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

        {/* ================= RIGHT SLIDE CART DRAWER ================= */}
        <div
          className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          onClick={() => setIsCartOpen(false)}
        />

        <aside
          className={`fixed top-0 right-0 h-full w-full sm:w-[400px] max-w-full bg-neutral-950 border-l border-neutral-800 z-50 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${isCartOpen ? "translate-x-0" : "translate-x-full"
            }`}
        >
          {/* Cart Drawer Header */}
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

          {/* Cart Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-3xl shadow-inner">
                  👜
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-white tracking-wide">Your cart is empty</h3>
                  <p className="text-xs text-gray-400 max-w-[240px]">
                    Explore our luxury watch collections and add your favorite items.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 bg-white text-black font-semibold text-xs py-3 px-8 rounded hover:bg-neutral-200 transition-colors uppercase tracking-wider shadow-lg hover:scale-105 transition-transform cursor-pointer"
                >
                  Explore Collections
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-neutral-900/60 border border-amber-500/20 p-3 rounded-xl">
                    {/* Checkbox for item selection */}
                    <input
                      type="checkbox"
                      checked={selectedCartIndexes.includes(idx)}
                      onChange={() => handleToggleCartSelect(idx)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      title="Select for checkout"
                    />

                    <img src={item.image} alt={item.title} className="w-14 h-14 object-contain bg-neutral-950 rounded-lg p-1" />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-amber-100 truncate">{item.title}</h4>
                      <p className="text-xs text-amber-400 font-Sans font-bold mt-1">{item.price}</p>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(idx)}
                      className="text-neutral-500 hover:text-amber-400 text-2xs duration-100 mr-1 cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-900 text-center">
            {cart.length > 0 ? (
              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs tracking-widest uppercase rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all cursor-pointer"
              >
                Proceed to Checkout
              </button>
            ) : (
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                100% Authentic Luxury Timepieces
              </p>
            )}
          </div>
        </aside>
        {/* //humburger inner menu */}

        {/* ================= LEFT MOBILE MENU DRAWER ================= */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Blur Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden"
              />

              {/* Sidebar Menu */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-neutral-950 border-r border-amber-500/20 z-[70] shadow-[20px_0_50px_rgba(0,0,0,0.8)] flex flex-col md:hidden overflow-hidden"
              >
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header (Profile/Auth & Close Button) */}
                <div className="p-5 border-b border-neutral-900 flex items-center justify-between relative z-10 bg-neutral-950/50">
                  <div className="flex items-center">
                    {session ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={session.user.image}
                          alt="Profile"
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

                  {/* Close Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-neutral-500 hover:text-amber-400 hover:bg-amber-500/10 p-1.5 rounded-full transition-all duration-300 focus:outline-none cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 relative z-10 [scrollbar-width:none]">
                  <span className="text-[10px] font-bold text-neutral-600 tracking-[0.25em] uppercase block mb-4 ml-2">
                    Menu Collections
                  </span>

                  <div className="flex flex-col gap-1">
                    {navLinks.map((link, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="group flex items-center justify-between py-3.5 px-4 rounded-xl hover:bg-neutral-900 border border-transparent hover:border-amber-500/20 transition-all duration-300"
                        >
                          <span className="text-[13px] font-bold text-neutral-300 group-hover:text-amber-400 tracking-widest uppercase transition-colors">
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
                    ))}
                  </div>
                </div>

                {/* Footer Logo Area */}
                <div className="p-6 border-t border-neutral-900 relative z-10 bg-neutral-950">
                  <div className="flex items-center justify-center">
                    <img src="/wlogo.png" alt="Logo" className="h-8 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                  </div>
                  <p className="text-center text-[9px] text-amber-500/50 uppercase tracking-[0.25em] mt-3 font-semibold">
                    Elegance On Your Wrist
                  </p>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

      </header>

      {/* Hero Banner Section */}
      <section className="relative w-full h-[550px] bg-gradient-to-b from-black/80 via-black/20 to-black/80 pt-5 pb-2 overflow-hidden select-none">
        <motion.div
          className="flex w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
          drag="x"
          dragSnapToOrigin={true}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ willChange: "transform" }}
        >
          {heroImages.map((imgUrl, index) => (
            <div key={index} className="w-full min-w-full h-full flex-shrink-0 px-5">
              <div className="relative w-full h-full rounded-4xl overflow-hidden bg-neutral-950">
                <img
                  src={imgUrl}
                  alt={`SVESTON Watch ${index + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Watches Mapping Section */}
      <div className="collection-cont">
        <div id="watch-collections" className="relative bg-neutral-950 py-24 px-4 sm:px-8 lg:px-16 overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-7xl mx-auto text-center mb-16 relative z-10"
          >
            <h2 className="wtxt text-2xl sm:text-[60px] font-Sans font-bold tracking-[0.25em] text-amber-100 uppercase">
              Featured Watch Curations
            </h2>
            <p className="wtxt text-[#DCAA4A] animate-pulse font-Sans text-xs tracking-[0.3em] uppercase mt-5 font-bold">
              Premium collectibles
            </p>
          </motion.div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {watches.map((watch) => (
              <motion.div
                key={watch.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  delay: (index % 4) * 0.08,
                  ease: "easeOut"
                }}
                style={{ willChange: "transform, opacity" }}
                className="group/card relative rounded-2xl bg-neutral-900/60 border border-amber-500/20 p-6 flex flex-col justify-between items-center transition-colors duration-300 hover:border-amber-400/80 hover:shadow-[0_0_35px_rgba(245,158,11,0.2)] hover:bg-neutral-900/90"
              >
                <div className="relative w-full h-64 flex items-center justify-center my-2 group/watch cursor-pointer">
                  <div className="absolute w-40 h-40 rounded-full bg-amber-500/0 group-hover/watch:bg-amber-500/20 blur-2xl transition-all duration-500 pointer-events-none" />

                  <motion.img
                    src={watch.image}
                    alt={watch.title}
                    className="h-full object-contain relative z-10 filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)]"
                    whileHover={{ y: -12, scale: 1.06 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  />
                </div>

                <div className="w-full text-center mt-4">
                  <h3 className="text-sm font-medium tracking-widest text-neutral-200 group-hover/card:text-amber-100 transition-colors duration-300 uppercase">
                    {watch.title}
                  </h3>
                  <p className="text-amber-400 font-semibold text-base mt-1.5 tracking-wider">
                    {watch.price}
                  </p>

                  <div className="mt-5 mb-4" onClick={() => setSelectedWatch(watch)}>
                    <button className="relative px-6 py-2 cursor-pointer rounded-full border border-amber-500/30 bg-neutral-950/80 text-amber-300/90 text-xs font-light tracking-widest uppercase transition-all duration-300 hover:border-amber-400 hover:text-white hover:bg-amber-500/20 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                      View Details
                    </button>
                  </div>

                  <span className="block text-[10px] tracking-[0.25em] text-neutral-500 font-light uppercase border-t border-neutral-800/80 pt-3">
                    {watch.spec}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center relative z-10">
            <Link href={'./new-arrival'}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-10 cursor-pointer py-3.5 rounded-full border border-amber-500/40 bg-neutral-950 text-amber-300 font-light tracking-[0.2em] text-xs uppercase transition-colors duration-500 hover:border-amber-400 hover:text-white hover:shadow-[0_0_35px_rgba(245,158,11,0.35)] hover:bg-amber-500/10"
              >
                <span className="relative z-10">Show More Collections</span>
                <span className="absolute inset-0 cursor-pointer rounded-full bg-amber-500/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= QUICK VIEW & CHECKOUT MODAL ================= */}
    <AnimatePresence>
        {(selectedWatch || isCheckout) && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto transform-gpu">

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedWatch(null);
                setIsCheckout(false);
                setCheckoutItems([]);
              }}
              style={{ willChange: "opacity" }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            />

            <motion.div
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

                {/* Left Column: Watch Image / Multiple Selected Items Display */}
                <div className="relative flex flex-col justify-center min-h-[280px] max-h-[380px] bg-neutral-900/50 rounded-2xl p-4 border border-amber-500/10 overflow-y-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="absolute w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none self-center transform-gpu" />

                  {isCheckout && checkoutItems.length > 0 ? (
                    <div className="space-y-3 relative z-10 w-full pr-1">
                      <h4 className="text-xs font-medium font-Sans tracking-widest text-amber-400 uppercase mb-2 border-b border-amber-500/20 pb-1">
                        Order Summary ({checkoutItems.length} Items)
                      </h4>
                      {checkoutItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            loading="lazy"
                            decoding="async"
                            className="w-12 h-12 object-contain bg-neutral-900 rounded-lg p-1" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-Sans font-bold text-amber-100 truncate">{item.title}</p>
                            <p className="text-xs font-Sans text-amber-400 font-semibold mt-1">{item.price}</p>
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
                          <Image
                            src={selectedWatch.image}
                            alt={selectedWatch.title}
                            fill
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.9)]"
                          />
                        </motion.div>
                      </div>
                    )
                  )}
                </div>

                {/* Right Column: Watch Details OR Checkout Form */}
                <div className="flex flex-col justify-between">
                  {!isCheckout ? (
                    /* 1. WATCH DETAILS VIEW */
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ willChange: "transform, opacity" }}
                    >
                      <span className="text-[10px] tracking-[0.3em] font-medium text-amber-500 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block mb-3">
                        {selectedWatch?.spec || "SWISS PRECISION MOVEMENT"}
                      </span>

                      <h2 className="text-2xl md:text-3xl font-bold text-amber-100 tracking-wider uppercase mb-2">
                        {selectedWatch?.title}
                      </h2>

                      <p className="text-xl md:text-2xl font-Sans font-semibold text-amber-400 tracking-wide mb-4 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                        {selectedWatch?.price}
                      </p>

                      <p className="text-neutral-400 text-xs md:text-sm leading-relaxed mb-6 border-t border-b border-neutral-800 py-4">
                        Crafted with sapphire crystal glass, 316L surgical-grade stainless steel, and high-precision automatic movement. A true statement of timeless elegance and craftsmanship.
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleAddToCart(selectedWatch)}
                          className="flex-1 py-3.5 px-6 rounded-full border border-amber-500/50 bg-neutral-900 text-amber-300 font-medium text-xs tracking-widest uppercase transition-all hover:bg-amber-500/10 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-4 cursor-pointer"
                        >
                          <span>
                            <Image
                              className="w-5 brightness-0 invert h-5"
                              src="/cart.png"
                              alt=""
                              width={20}
                              height={20}
                            />
                          </span> Add To Cart
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setCheckoutItems([selectedWatch]);
                            setIsCheckout(true);
                          }}
                          className="flex-1 py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-Sans font-bold text-xs tracking-widest uppercase shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] transition-all cursor-pointer"
                        >
                          Buy Now
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    /* 2. CHECKOUT FORM VIEW */
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

                        if (!name) {
                          setErrorMessage("Please enter your name.");
                          return;
                        }

                        if (!phone) {
                          setErrorMessage("Please enter your phone number.");
                          return;
                        }

                        if (!address) {
                          setErrorMessage("Please enter your shipping address.");
                          return;
                        }

                        if (!screenshotBase64) {
                          setErrorMessage("Please upload your payment screenshot.");
                          return;
                        }

                        setLoading(true);

                        const formData = {
                          name,
                          phone,
                          email: e.target.email?.value.trim() || "",
                          address,
                          paymentMethod,
                          watchTitle: checkoutItems.map((item) => item.title).join(", "),
                          watchPrice: calculateTotal(checkoutItems),
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
                          setErrorMessage("Network error! Check the connection of your device");
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
                          className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 p-3 rounded-xl text-xs text-center font-semibold flex items-center justify-center gap-2"
                        >
                          <span>✓</span> Order Successful! Thank you for your purchase.
                        </motion.div>
                      )}

                      {errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-red-500/20 border border-red-500/50 text-red-300 p-2.5 rounded-xl text-xs text-center font-semibold flex items-center justify-center gap-4"
                        >
                          <span className="text-[15px]">⚠️</span> {errorMessage}
                        </motion.div>
                      )}

                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2">
                        <h3 className="text-sm font-extrabold text-amber-300 tracking-wider uppercase">
                          Checkout
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsCheckout(false)}
                          className="text-xs text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          ← Back
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                          Full Name
                        </label>
                        <input
                          required
                          name="name"
                          type="text"
                          placeholder="Muhammad Haris"
                          className="w-full bg-neutral-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-amber-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                            WhatsApp / Mobile Number
                          </label>
                          <input
                            required
                            name="phone"
                            type="tel"
                            placeholder="0300 1234567"
                            className="w-full bg-neutral-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-amber-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                            Email Address
                          </label>
                          <input
                            required
                            name="email"
                            type="email"
                            placeholder="Enter Your Email"
                            className="w-full bg-neutral-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-amber-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                          Shipping Address (House #, Street, City)
                        </label>
                        <input
                          required
                          name="address"
                          type="text"
                          placeholder="House #123, Street 5, Phase 4, Lahore"
                          className="w-full bg-neutral-900/90 border border-amber-500/30 rounded-xl px-3.5 py-2 text-xs text-amber-100 placeholder-neutral-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50"
                        />
                      </div>

                      {/* Dynamic Payment Method Selector & Details */}
                      <div className="bg-neutral-950/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 my-3 shadow-[0_0_25px_rgba(245,158,11,0.08)]">

                        {/* Step Header */}
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                          <span className="text-[11px] font-sans font-medium text-amber-400 tracking-[0.2em] uppercase">
                            Step 1 — Send Payment
                          </span>
                          <span className="text-xs sm:block hidden font-sans font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                            {calculateTotal(checkoutItems)}
                          </span>
                        </div>

                        {/* Method Toggle Buttons (Tab Bar) */}
                        <div className="grid grid-cols-3 gap-2 bg-neutral-900/80 p-1.5 rounded-xl border border-neutral-800">
                          {["EASYPAISA", "JAZZCASH"].map((method) => {
                            const isSelected = paymentMethod === method;
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`relative py-1 px-2 rounded-lg font-sans font-medium text-[11px] sm:text-xs tracking-wider transition-all duration-300 cursor-pointer overflow-hidden ${isSelected
                                    ? "text-amber-300 border border-amber-400/70 bg-gradient-to-b from-amber-500/20 to-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                                    : "text-neutral-400 hover:text-neutral-200 border border-transparent hover:bg-neutral-800/60"
                                  }`}
                              >
                                {method}
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

                        {/* Details Display with Glow & Fade Animation */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={paymentMethod}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-3 pt-1"
                          >
                            {/* Account / Mobile Number Box */}
                            <div className="flex items-center justify-between bg-neutral-900/90 border border-amber-500/20 rounded-xl p-2 hover:border-amber-500/40 transition-all group">
                              <div>
                                <span className="block text-[11px] font-Sans font-medium text-neutral-400 tracking-wider uppercase mb-1">
                                  {paymentData[paymentMethod].label}
                                </span>
                                <span className="font-Sans font-bold text-[#DCAA4A] drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] tracking-wider">
                                  {paymentData[paymentMethod].number}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(paymentData[paymentMethod].number);
                                  setCopiedField("number");
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-neutral-950/80 text-amber-300 hover:text-white hover:border-amber-400 hover:bg-amber-500/20 text-[11px] font-sans font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                              >
                                📋 {copiedField === "number" ? "Copied!" : "Copy"}
                              </button>
                            </div>

                            {/* Account Title Box */}
                            <div className="flex items-center justify-between bg-neutral-900/90 border border-amber-500/20 rounded-xl p-2 hover:border-amber-500/40 transition-all group">
                              <div>
                                <span className="block text-[12px] font-sans font-medium text-neutral-400 tracking-wider uppercase">
                                  ACCOUNT TITLE
                                </span>
                                <span className="font-Sans font-bold text-mauve-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] tracking-wider">
                                  {paymentData[paymentMethod].accountTitle}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(paymentData[paymentMethod].accountTitle);
                                  setCopiedField("title");
                                  setTimeout(() => setCopiedField(null), 2000);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-neutral-950/80 text-amber-300 hover:text-white hover:border-amber-400 hover:bg-amber-500/20 text-[11px] font-sans font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                              >
                                📋 {copiedField === "title" ? "Copied!" : "Copy"}
                              </button>
                            </div>

                            <p className="text-[13px] font-sans font-medium text-neutral-400 pt-1 tracking-wide">
                              {paymentData[paymentMethod].instruction}
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      <div className="bg-neutral-900/70 border border-amber-500/20 rounded-xl p-3 space-y-2 mt-2">

                        <label className="relative flex flex-col items-center justify-center border border-dashed border-amber-500/40 rounded-lg p-2.5 bg-neutral-950/60 cursor-pointer hover:border-amber-400 transition-all">
                          <span className="text-[11px] text-neutral-300 font-medium flex items-center">
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
                        className={`w-full mt-3 py-3 rounded-full text-neutral-950 font-bold text-xs tracking-widest uppercase transition-all ${loading || orderSuccess
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
        )}
      </AnimatePresence> 

      {/* Footer Promise */}
      <section className="relative bg-black py-20 px-4 sm:px-8 lg:px-16 border-t border-neutral-900 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-2"
          >
            <span className="wtxt text-2xs animate-pulse font-mono tracking-[0.35em] text-[#DCAA4A] uppercase block font-semibold">
              The House Promise
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-amber-100 tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              Why Collectors Buy From Us
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto my-3" />
            <p className="text-neutral-400 text-xs sm:text-sm font-light tracking-wide max-w-xl mx-auto">
              Four commitments that come standard with every timepiece we deliver.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                ),
                title: "FREE NATIONWIDE SHIPPING",
                desc: "Every order ships free across Pakistan, packed in a protective collector case with tracking from day one."
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                title: "7-DAY EASY RETURNS",
                desc: "Wear it, weigh it, decide later. If the fit is not right, send it back within seven days, no questions."
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "1 YEAR WARRANTY",
                desc: "Movement, crown and strap hardware covered for a full year by our in-house service workshop."
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                title: "100% AUTHENTIC",
                desc: "Sourced through authorised channels and inspected twice before it is allowed to leave our vault."
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative rounded-2xl bg-neutral-950/80 border border-neutral-800 p-6 flex flex-col items-center text-center transition-all duration-500 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="w-14 h-14 rounded-xl bg-neutral-900 border border-amber-500/30 flex items-center justify-center mb-5 group-hover:border-amber-400 group-hover:bg-amber-500/10 transition-colors shadow-inner relative z-10">
                  {item.icon}
                </div>

                <h3 className="text-[14px] font-Sans font-bold tracking-[0.2em] text-neutral-100 uppercase mb-3 group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>

                <p className="text-[13.3px] text-neutral-400 leading-relaxed font-light">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curated Categories */}
      <section className="relative bg-black py-20 px-4 sm:px-8 lg:px-16 border-t border-neutral-900 overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-2"
          >
            <span className="wtxt text-2xs animate-pulse font-mono tracking-[0.35em] text-[#DCAA4A] uppercase block font-semibold">
              Curated Categories
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-amber-100 tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              Built For Every Wrist
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto my-3" />
            <p className="text-neutral-400 text-xs sm:text-sm font-Sans tracking-wide max-w-xl mx-auto">
              Two houses of craft under one roof, each with its own standards of finishing and service.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl bg-neutral-950 border border-neutral-800 p-8 sm:p-10 flex flex-col justify-between transition-all duration-500 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-all duration-500" />

              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
                    ⏱️
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold tracking-[0.2em] text-amber-100 uppercase">
                      Classic Timepieces
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-Sans font-medium uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                        120+ Models
                      </span>
                      <span className="text-[11px] font-Sans font-medium uppercase bg-neutral-900 text-neutral-300 border border-neutral-800 px-2.5 py-0.5 rounded-full hover:border-gray-400 hover:bg-[#201E1A] duration-300">
                        4.8 / 5 Rated
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed font-Sans font-medium mb-8">
                  Automatic and quartz dress watches with sapphire crystal, genuine leather straps and movements finished by hand for collectors who prefer restraint over noise.
                </p>

                <div className="mb-8 border-t border-neutral-900 pt-6">
                  <span className="text-[12px] font-Sans font-bold uppercase tracking-[0.10em] text-neutral-500 block mb-3 mix-blend-overlay">
                    What's Included
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 font-light">
                    {["Swiss & Japanese Movements", "Sapphire Crystal Glass", "Genuine Leather Straps", "Free Sizing & Engraving"].map((inc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-amber-400 text-xs font-Sans font-medium">✓</span>
                        <span className="text-[12px] font-Sans font-medium">{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <span className="text-[11px] font-Sans uppercase tracking-[0.15em] text-neutral-500 block mb-3 font-bold">
                    Signature Details
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {["AUTOMATIC", "CHRONOGRAPH", "SKELETON", "ROSE GOLD", "GMT"].map((tag, i) => (
                      <span key={i} className="text-[11px] font-medium uppercase bg-neutral-900/80 text-neutral-400 border border-neutral-800 px-3 py-1 rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-neutral-900 pt-6">
                <Link href="/men" className="flex-1">
                  <button className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer">
                    Shop Now
                  </button>
                </Link>
                <Link href="#watch-collections" className="flex-1">
                  <button className="w-full py-3 rounded-full border border-amber-500/30 bg-neutral-950 text-amber-300 font-medium text-xs uppercase tracking-widest hover:border-amber-400 hover:text-white hover:bg-amber-500/10 transition-all cursor-pointer">
                    View Details
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl bg-neutral-950 border border-neutral-800 p-8 sm:p-10 flex flex-col justify-between transition-all duration-500 hover:border-amber-500/50 hover:shadow-[0_0_40px_rgba(245,158,11,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-all duration-500" />

              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-400">
                    ⌚
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold tracking-[0.2em] text-amber-100 uppercase">
                      Smart Watches
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-Sans font-medium uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                        60+ Models
                      </span>
                      <span className="text-[11px] font-Sans font-medium uppercase bg-neutral-900 text-neutral-300 border border-neutral-800 px-2.5 py-0.5 rounded-full hover:border-gray-400 hover:bg-[#201E1A] duration-300">
                        98% Satisfaction
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed font-Sans font-medium mb-8">
                  AMOLED smart wearables with health tracking, always-on displays and multi-day battery life, tuned and updated before dispatch so they work the minute you unbox them.
                </p>

                <div className="mb-8 border-t border-neutral-900 pt-6">
                  <span className="text-[12px] font-Sans font-bold uppercase tracking-[0.10em] text-neutral-500 block mb-3 mix-blend-overlay">
                    What's Included
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 font-light">
                    {["AMOLED Always-On Display", "Heart Rate & SpO2", "7-Day Battery Life", "IP68 Water Resistance"].map((inc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-amber-400 text-xs font-bold">✓</span>
                        <span className="text-[12px] font-Sans font-medium">{inc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <span className="text-[11px] font-Sans uppercase tracking-[0.15em] text-neutral-500 block mb-3 font-bold">
                    Signature Details
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {["AMOLED", "BLUETOOTH CALLING", "GPS", "FITNESS", "IP68"].map((tag, i) => (
                      <span key={i} className="text-[11px] font-medium uppercase bg-neutral-900/80 text-neutral-400 border border-neutral-800 px-3 py-1 rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-neutral-900 pt-6">
                <Link href="/smart-watches" className="flex-1">
                  <button className="w-full py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer">
                    Shop Now
                  </button>
                </Link>
                <Link href="#watch-collections" className="flex-1">
                  <button className="w-full py-3 rounded-full border border-amber-500/30 bg-neutral-950 text-amber-300 font-medium text-xs uppercase tracking-widest hover:border-amber-400 hover:text-white hover:bg-amber-500/10 transition-all cursor-pointer">
                    View Details
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative bg-black py-20 px-4 sm:px-8 lg:px-16 border-t border-neutral-900 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14 space-y-2"
          >
            <span className="wtxt text-xs animate-pulse tracking-[0.35em] text-[#DCAA4A] uppercase block font-Sans font-bold">
              Support
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-amber-100 tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              Frequently Asked Questions
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto my-3" />
            <p className="text-neutral-400 text-xs sm:text-sm font-light tracking-wide">
              Everything buyers ask us before their first order.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqData.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen
                    ? "bg-neutral-950 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                    : "bg-neutral-950/60 border-neutral-800 hover:border-amber-500/30 hover:bg-neutral-900/80"
                    }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <span className={`text-xs sm:text-sm font-medium tracking-wide transition-colors ${isOpen ? "text-amber-300" : "text-neutral-200 group-hover:text-amber-200"
                      }`}>
                      {faq.q}
                    </span>

                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs transition-all duration-300 flex-shrink-0 ${isOpen
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-400 group-hover:border-amber-500/30 group-hover:text-amber-400"
                      }`}>
                      {isOpen ? "−" : "+"}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-6 pt-1 border-t border-neutral-900/80 text-xs sm:text-sm text-neutral-400 leading-relaxed font-light">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-10 text-center text-xs text-neutral-400">
            Still unsure?{" "}
            <a
              href="https://wa.me/923186643032"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 underline font-medium hover:text-amber-300 transition-colors"
            >
              Talk to us on WhatsApp
            </a>{" "}
            and a specialist will guide you.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-neutral-900 pt-16 pb-8 px-4 sm:px-8 lg:px-16 text-neutral-400 text-xs relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-900">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-serif text-amber-400 tracking-wider"><img src="/wLogo.png" width={60} height={60} alt="" /></span>
              </div>
              <p className="text-amber-400/90 text-xs font-medium tracking-widest uppercase">
                Elegance On Your Wrist
              </p>

              <p className="text-neutral-400 text-xs leading-relaxed max-w-sm font-light pt-2">
                A Pakistani watch house curating automatic, chronograph and smart timepieces for people who treat time as an heirloom.
              </p>

              <div className="space-y-2 pt-2 text-neutral-300">
                <div className="flex items-center gap-3">
                  <span className="text-amber-400">📞</span>
                  <span>+92 318 664 3032</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400">✉️</span>
                  <span>care@eleganceonyourwrist.pk</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400">📍</span>
                  <span>Dolmen Mall, Clifton, Karachi</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                {[
                  {
                    name: "Instagram",
                    href: "#",
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                    ),
                  },
                  {
                    name: "Facebook",
                    href: "#",
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    ),
                  },
                  {
                    name: "WhatsApp",
                    href: "#",
                    icon: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99 0-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                    ),
                  },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    aria-label={social.name}
                    className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100">Shop</h4>
              <ul className="space-y-2.5 font-light">
                {["New Arrivals", "Men", "Women", "Smart Watches", "For Couples"].map((item, idx) => (
                  <li key={idx}>
                    <a href="#" className="hover:text-amber-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100">Help</h4>
              <ul className="space-y-2.5 font-light">
                {["Track Order", "Shipping & Delivery", "Returns & Exchange", "Warranty Claim", "Size Guide", "Contact Us"].map((item, idx) => (
                  <li key={idx}>
                    <a href="#" className="hover:text-amber-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100">House</h4>
              <ul className="space-y-2.5 font-light">
                {["Our Story", "Authenticity Promise", "Watch Care Guide", "Blog", "Careers", "Store Locator"].map((item, idx) => (
                  <li key={idx}>
                    <a href="#" className="hover:text-amber-300 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-900">
            <div className="flex flex-wrap items-center gap-2">
              {["JAZZCASH", "EASYPAISA"].map((pay, i) => (
                <span key={i} className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                  {pay}
                </span>
              ))}
            </div>

            <div className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Secure Checkout • SSL Encrypted
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500 font-light">
            <p>© 2026 Elegance On Your Wrist. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-neutral-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-neutral-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-neutral-300 transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

