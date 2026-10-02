"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import wLogo from "@/public/wLogo.png";
import { useRouter } from "next/navigation";

// 🔒 STRICT ADMIN AUTHORIZATION
const AUTHORIZED_ADMIN_EMAIL = "opff56266@gmail.com";
const ADMIN_ID_NAME = "Haris Malik".trim();

const COLLECTIONS_LIST = [
  { id: "all", label: "All Collections" },
  { id: "featured", label: "Home Page (Featured)" }, 
  { id: "freshdrop", label: "Fresh Drop" },
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "smart", label: "Smart Watches" },
  { id: "couples", label: "Couples" },
];


const SUB_CATEGORIES = [
  "All",
  "Chronograph",
  "Automatic",
  "Steel Edition",
  "Leather Strap",
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("overview"); // overview, products, clients, logins
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Live Database States
  const [watches, setWatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  const router = useRouter();
 const userEmail = session?.user?.email?.toLowerCase().trim();
  const isAdmin = userEmail === "opff56266@gmail.com";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || (status === "authenticated" && !isAdmin)) {
      router.replace("/");
    }
  }, [status, isAdmin, router]);

  // 🟢 Live Traffic & Visit Statistics State
  const [trafficStats, setTrafficStats] = useState({
    totalVisits: 0,
    todayVisits: 0,
    authorizedVisits: 0,
    guestVisits: 0,
  });

  // Filters
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");

  // Modals & Inline Edits
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [newPrices, setNewPrices] = useState({});

  // Add Watch Form State
  const [newWatch, setNewWatch] = useState({
  title: "",
  price: "",
  originalPrice: "",
  collectionName: "featured", // Home page featured cards ke liye
  category: "featured",
  subCategory: "Automatic",
  spec: "SWISS PRECISION MOVEMENT",
  description: "", // 👈 View Details ke liye
  stock: 10,
  tag: "NEW",
  image: "/wClassic.png",
  imageBase64: "",
});

  // 1. Fetch All Database Information
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [watchesRes, ordersRes, usersRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/users"),
        fetch("/api/admin/analytics"),
      ]);

      const wData = await watchesRes.json();
      const oData = await ordersRes.json();
      const uData = await usersRes.json();
      const aData = await analyticsRes.json();

      if (wData.success) setWatches(wData.watches || []);
      if (oData.success) setOrders(oData.orders || []);
      if (uData.success) setUsers(uData.users || []);

      if (aData.success && aData.stats) {
        setTrafficStats(aData.stats);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchAllData();
  }, []);

  // Filtered Watches calculation
  const filteredWatches = useMemo(() => {
    return watches.filter((w) => {
      const watchCol = (w.collectionName || w.category || "").toLowerCase().trim();
      const watchSub = (w.subCategory || "").toLowerCase().trim();

      const matchesCollection =
        selectedCollection === "all" || watchCol === selectedCollection.toLowerCase().trim();
      const matchesSub =
        selectedSubCategory === "All" || watchSub === selectedSubCategory.toLowerCase().trim();

      return matchesCollection && matchesSub;
    });
  }, [watches, selectedCollection, selectedSubCategory]);

  // Handlers
  // 🟢 Fixed Safe Add Watch Handler
  const handleAddWatchSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWatch),
      });

      const data = await res.json();
      if (data.success) {
        setWatches((prev) => [data.watch, ...prev]);
        setIsAddModalOpen(false);
        setNewWatch({
          title: "",
          price: "",
          originalPrice: "",
          collectionName: "freshdrop",
          category: "freshdrop",
          subCategory: "Automatic",
          spec: "SWISS PRECISION MOVEMENT",
          description: "",
          stock: 10,
          tag: "NEW",
          rating: 4.9,
          reviews: 24,
          image: "/wClassic.png",
          imageBase64: "",
        });
        alert("Watch successfully added to store!");
      } else {
        alert(data.error || "Failed to add watch");
      }
    } catch (err) {
      console.error("Add watch error details:", err);
      alert(`Error: ${err.message || "Failed to upload image. Please try a smaller image."}`);
    }
  };

  const handleUpdatePrice = async (id) => {
    const updatedPrice = newPrices[id];
    if (!updatedPrice) return;

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, price: Number(updatedPrice) }),
      });

      const data = await res.json();
      if (data.success) {
        setWatches((prev) =>
          prev.map((w) => (w._id === id ? { ...w, price: Number(updatedPrice) } : w))
        );
        setEditingPriceId(null);
      }
    } catch (err) {
      alert("Error updating price");
    }
  };

  const handleDeleteWatch = async (id) => {
    if (!confirm("Are you sure you want to remove this watch?")) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setWatches((prev) => prev.filter((w) => w._id !== id));
      }
    } catch (err) {
      alert("Error deleting watch");
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status } : o))
        );
        if (selectedOrderDetails?._id === orderId) {
          setSelectedOrderDetails((prev) => ({ ...prev, status }));
        }
      }
    } catch (err) {
      alert("Status update failed");
    }
  };
   const handleStockChange = async (watchId, newStock) => {
    const safeStock = Math.max(0, Number(newStock) || 0);

    // 🟢 1. UI par foran update dikhane ke liye (No lag)
    setWatches((prev) =>
      prev.map((item) =>
        item._id === watchId ? { ...item, stock: safeStock } : item
      )
    );

    // 🟢 2. Database mein save karne ke liye API call
    try {
      await fetch("/api/watches/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: watchId, stock: safeStock }),
      });
    } catch (err) {
      console.error("Stock save nahi ho saka:", err);
    }
  };

  // 🟢 Delete Order Handler
  const handleDeleteOrder = async (orderId) => {
    if (!confirm("Kya aap waqayi yeh order delete karna chahte hain?")) return;
    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
        if (selectedOrderDetails?._id === orderId) {
          setSelectedOrderDetails(null);
        }
      } else {
        alert(data.error || "Order delete nahi ho saka.");
      }
    } catch (err) {
      alert("Order delete karne mein error aaya!");
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    return d.toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const totalRevenue = orders.reduce((sum, o) => {
    const numeric = Number(String(o.watchPrice || "").replace(/[^0-9]/g, "")) || 0;
    return sum + numeric;
  }, 0);

  // Screen Loading & Block Check
  if (!isMounted || status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-amber-400 font-bold text-sm sm:text-base">
        <span className="animate-spin text-2xl mr-3">⏳</span> Loading Secured Panel...
      </div>
    );
  }

  // Agar unauthorized user ho toh screen par kuch bhi render na ho
  if (!session || !isAdmin) {
    return null;
  }

  const menuItems = [
    { id: "overview", label: "Store Analytics", icon: "📊" },
    { id: "products", label: "Manage Catalog", icon: "⌚" },
    { id: "clients", label: "Clients & Orders", icon: "👥" },
    { id: "logins", label: "Customer Accounts", icon: "🔐" },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-black text-white font-jakarta overflow-hidden">
      
      {/* ================= MOBILE SIDEBAR BACKDROP ================= */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ================= SIDEBAR (DESKTOP & MOBILE DRAWER) ================= */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-64 sm:w-72 bg-neutral-950 border-r border-neutral-900 flex flex-col z-50 transition-transform duration-300 ease-in-out shrink-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 sm:p-6 border-b border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={wLogo} alt="Logo" width={34} height={34} className="object-contain" />
            <span className="text-base sm:text-lg font-extrabold text-[#DCAA4A] uppercase tracking-widest">
              Store Admin
            </span>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-white p-1 text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-1.5 sm:space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 sm:py-3 rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold tracking-wide cursor-pointer ${
                activeTab === item.id 
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" 
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-white border border-transparent"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 sm:p-4 border-t border-neutral-900">
          <div className="flex items-center gap-3 bg-neutral-900/80 p-2.5 sm:p-3 rounded-xl border border-neutral-800">
            <Image
              src={session?.user?.image || ""}
              alt="Admin"
              width={36}
              height={36}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-amber-500/50 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white truncate">{session?.user?.name || "Admin"}</p>
              <p className="text-[11px] sm:text-xs text-amber-400 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              title="Logout"
              className="text-neutral-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5">
                <path d="M14.5 6c-.05-1.1-.19-1.79-.6-2.33a2.9 2.9 0 0 0-.55-.55C12.54 2.5 11.36 2.5 9.01 2.5H8.5C5.68 2.5 4.26 2.5 3.38 3.38 2.5 4.26 2.5 5.67 2.5 8.5v7c0 2.83 0 4.24.88 5.12.88.88 2.3.88 5.12.88h.51c2.35 0 3.53 0 4.34-.62.21-.16.4-.35.55-.55.41-.54.55-1.24.6-2.33"></path>
                <path d="M20.5 12h-12M18 15.5s3.5-2.58 3.5-3.5-3.5-3.5-3.5-3.5"></path>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-black">
        <div className="absolute top-[-10rem] right-[-10rem] w-[25rem] sm:w-[35rem] h-[25rem] sm:h-[35rem] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />

        {/* 🟢 2. Top Header apni jagah freeze rahega */}
        <header className="shrink-0 w-full h-16 sm:h-20 border-b border-neutral-900 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-black/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-300 hover:text-white rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
              aria-label="Open Navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm sm:text-base md:text-xl font-extrabold text-white uppercase tracking-wider truncate">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <button 
              onClick={fetchAllData} 
              className="group flex items-center gap-1.5 text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full hover:border-amber-400 text-neutral-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="w-3.5 h-3.5 fill-current text-neutral-400 group-hover:text-amber-400 transition-transform duration-500 group-hover:rotate-180 shrink-0"
              >
                <path d="M19.603 12.635a.99.99 0 0 0-1.135.844 6.4 6.4 0 0 1-1.83 3.618 6.506 6.506 0 0 1-9.192 0 6.507 6.507 0 0 1 0-9.192 6.4 6.4 0 0 1 3.503-1.8 6.2 6.2 0 0 1 1.848-.055 6.4 6.4 0 0 1 2.466.828l-1.302.223a1 1 0 1 0 .338 1.971l3.49-.596a1 1 0 0 0 .816-1.155l-.597-3.49a1 1 0 1 0-1.97.338l.156.919a8.4 8.4 0 0 0-3.17-1.025 8.1 8.1 0 0 0-2.428.074 8.38 8.38 0 0 0-4.564 2.354c-3.313 3.314-3.313 8.705 0 12.02a8.47 8.47 0 0 0 6.01 2.485 8.47 8.47 0 0 0 6.01-2.485 8.4 8.4 0 0 0 2.394-4.741 1 1 0 0 0-.843-1.135" />
              </svg>
              <span>Refresh</span>
            </button>

            <span className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live DB
            </span>
          </div>
        </header>

        {/* 🟢 3. pb-6 sm:pb-8 ki wajah se scroll theek aakhri card ke border par ruk jayega */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 pb-6 sm:pb-8 z-10 relative bg-black">
          {loading ? (
            <div className="h-full flex items-center justify-center text-amber-400 gap-2.5 font-semibold text-xs sm:text-sm">
              <span className="animate-spin text-xl">⏳</span> Fetching Latest Store Records...
            </div>
          ) : (
            <AnimatePresence mode="wait">

              {/* 1. OVERVIEW & TRAFFIC TAB */}
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    
                    {/* Today's Visits */}
                    <div className="bg-neutral-950 border border-neutral-800 p-4 sm:p-6 rounded-2xl shadow-lg">
                      <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Today's Visits</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{trafficStats.todayVisits}</h3>
                      <p className="text-emerald-400 text-xs mt-1.5 font-medium">Live Visitors Today</p>
                    </div>

                    {/* Guest / Unauthorized Traffic */}
                    <div className="bg-neutral-950 border border-neutral-800 p-4 sm:p-6 rounded-2xl shadow-lg">
                      <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Guest / Unauthorized</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-300">{trafficStats.guestVisits}</h3>
                      <p className="text-neutral-500 text-xs mt-1.5 font-medium">Without Login / Browsing</p>
                    </div>

                    {/* Authorized / Logged-in Traffic */}
                    <div className="bg-neutral-950 border border-neutral-800 p-4 sm:p-6 rounded-2xl shadow-lg">
                      <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Authorized Logins</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#DCAA4A]">{trafficStats.authorizedVisits}</h3>
                      <p className="text-emerald-400 text-xs mt-1.5 font-medium">Google Signed-in Users</p>
                    </div>

                    {/* All-Time Lifetime Visits */}
                    <div className="bg-neutral-950 border border-amber-500/30 p-4 sm:p-6 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.08)]">
                      <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1.5">All-Time Pageviews</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{trafficStats.totalVisits}</h3>
                      <p className="text-neutral-400 text-xs mt-1.5 font-medium">Total Database Visits</p>
                    </div>

                  </div>

                  {/* Revenue Snapshot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-neutral-950 border border-neutral-800 p-4 sm:p-6 rounded-2xl">
                      <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Verified Store Revenue</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-[#DCAA4A]">Rs. {totalRevenue.toLocaleString("en-PK")}</h3>
                      <p className="text-neutral-400 text-xs mt-1.5">Calculated from {orders.length} total customer orders</p>
                    </div>

                    <div className="bg-neutral-950 border border-neutral-800 p-4 sm:p-6 rounded-2xl">
                      <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Registered Accounts</p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{users.length}</h3>
                      <p className="text-neutral-400 text-xs mt-1.5">Total authenticated users in database</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 2. WATCHES & PRICES MANAGEMENT TAB */}
              {activeTab === "products" && (
                <motion.div key="products" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 sm:space-y-6">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 bg-neutral-950 p-4 sm:p-6 rounded-2xl border border-neutral-800">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">Watches Catalog</h3>
                      <p className="text-xs text-neutral-400">Showing {filteredWatches.length} of {watches.length} watches</p>
                    </div>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-black px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer text-center"
                    >
                      + Add New Watch
                    </button>
                  </div>

                  {/* Collections & Sub-Category Filters */}
                  <div className="bg-neutral-950/80 border border-neutral-800 p-3.5 sm:p-5 rounded-2xl space-y-4">
                    <div>
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                        1. Filter Collection:
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {COLLECTIONS_LIST.map((col) => (
                          <button
                            key={col.id}
                            onClick={() => setSelectedCollection(col.id)}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                              selectedCollection === col.id
                                ? "bg-[#DCAA4A] text-black shadow-[0_0_15px_rgba(220,170,74,0.3)]"
                                : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                            }`}
                          >
                            {col.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                        2. Filter Sub-Category:
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {SUB_CATEGORIES.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setSelectedSubCategory(sub)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider transition-all cursor-pointer ${
                              selectedSubCategory === sub
                                ? "bg-amber-500/20 text-amber-300 border border-amber-400"
                                : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[650px]">
                        <thead className="bg-neutral-900 text-neutral-400 text-xs uppercase tracking-wider border-b border-neutral-800">
                          <tr>
                            <th className="p-3.5 sm:p-4">Watch Stock</th>
                            <th className="p-3.5 sm:p-4">Stock Change</th>
                            <th className="p-3.5 sm:p-4">Title & Spec</th>
                            <th className="p-3.5 sm:p-4">Collection</th>
                            <th className="p-3.5 sm:p-4">Sub-Category</th>
                            
                            <th className="p-3.5 sm:p-4">Price (PKR)</th>
                            <th className="p-3.5 sm:p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 text-xs sm:text-sm">
                          {filteredWatches.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-neutral-500 font-semibold uppercase text-xs">
                                No watches found in "{selectedCollection}" under "{selectedSubCategory}"
                              </td>
                            </tr>
                          ) : (
                            filteredWatches.map((watch) => (
                              <tr key={watch._id} className="hover:bg-neutral-900/40 transition-colors">
                               <td className="p-3.5 sm:p-4">
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
      (watch.stock ?? 10) > 0
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        : "bg-red-500/10 text-red-400 border-red-500/30"
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${ (watch.stock ?? 10) > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
    {(watch.stock ?? 10) > 0 ? `${watch.stock} In Stock` : "Out of Stock"}
  </span>
</td>

<td className="py-4 px-4">
  <div className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-2 py-1 rounded-full shadow-inner">
    {/* Minus (−) Button */}
    <button
      type="button"
      onClick={() => handleStockChange(watch._id, (watch.stock ?? 0) - 1)}
      className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-amber-500 hover:text-black font-bold text-xs transition-all active:scale-90"
    >
      −
    </button>

    {/* Live Status Indicator Dot */}
    <span
      className={`w-2 h-2 rounded-full ${
        (watch.stock ?? 0) > 0
          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          : "bg-red-500"
      }`}
    />

    {/* Editable Number Input */}
    <input
      type="number"
      min="0"
      value={watch.stock ?? 0}
      onChange={(e) => {
        const val = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
        handleStockChange(watch._id, val);
      }}
      className="w-10 text-center bg-transparent text-white font-mono font-bold text-xs outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />

    {/* Plus (+) Button */}
    <button
      type="button"
      onClick={() => handleStockChange(watch._id, (watch.stock ?? 0) + 1)}
      className="w-5 h-5 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-300 hover:bg-amber-500 hover:text-black font-bold text-xs transition-all active:scale-90"
    >
      +
    </button>
  </div>
</td>

                                <td className="p-3.5 sm:p-4">
                                  <p className="font-bold text-amber-100">{watch.title}</p>
                                  <p className="text-xs text-neutral-500 truncate max-w-[180px]">{watch.spec}</p>
                                </td>
                                <td className="p-3.5 sm:p-4 uppercase text-xs font-semibold text-neutral-300">
                                  <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                                    {watch.collectionName || watch.category}
                                  </span>
                                </td>
                                <td className="p-3.5 sm:p-4 text-xs font-semibold text-amber-300/80">
                                  {watch.subCategory || "Automatic"}
                                </td>
                                <td className="p-3.5 sm:p-4">
                                  {editingPriceId === watch._id ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        defaultValue={watch.price}
                                        onChange={(e) => setNewPrices({ ...newPrices, [watch._id]: e.target.value })}
                                        className="w-24 bg-black border border-amber-500 rounded px-2 py-1 text-amber-300 text-xs sm:text-sm focus:outline-none"
                                      />
                                      <button 
                                        onClick={() => handleUpdatePrice(watch._id)} 
                                        className="text-xs bg-amber-500 text-black px-2 py-1 rounded font-bold hover:bg-amber-400 cursor-pointer"
                                      >
                                        ✓
                                      </button>
                                    </div>
                                  ) : (
                                    <span 
                                      onClick={() => setEditingPriceId(watch._id)}
                                      className="font-bold text-[#DCAA4A] cursor-pointer hover:underline whitespace-nowrap"
                                      title="Click to edit price"
                                    >
                                      Rs. {watch.price?.toLocaleString("en-PK")} ✎
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 sm:p-4 text-right">
                                  <button 
                                    onClick={() => handleDeleteWatch(watch._id)} 
                                    className="text-xs border border-red-500/40 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-all cursor-pointer font-semibold"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 3. CLIENTS & ORDERS TAB */}
              {activeTab === "clients" && (
                <motion.div key="clients" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-4 sm:p-6 border-b border-neutral-900 bg-neutral-900/30 flex justify-between items-center">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">Customer Orders</h3>
                        <p className="text-xs text-neutral-400">Total orders received: {orders.length}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[700px]">
                        <thead className="bg-neutral-900 text-neutral-400 text-xs uppercase tracking-wider border-b border-neutral-800">
                          <tr>
                            <th className="p-3.5 sm:p-4">Time</th>
                            <th className="p-3.5 sm:p-4">Client</th>
                            <th className="p-3.5 sm:p-4">Contact</th>
                            <th className="p-3.5 sm:p-4">Items & Amount</th>
                            <th className="p-3.5 sm:p-4">Status</th>
                            <th className="p-3.5 sm:p-4 text-right">Dossier</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 text-xs sm:text-sm">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-neutral-900/40 transition-colors">
                          <td className="p-3.5 sm:p-4 text-xs font-mono text-neutral-400 whitespace-nowrap">
                            {formatDateTime(order.createdAt)}
                          </td>
                          <td className="p-3.5 sm:p-4 font-bold text-white whitespace-nowrap">{order.name}</td>
                          <td className="p-3.5 sm:p-4 text-neutral-300 font-mono text-xs whitespace-nowrap">{order.phone}</td>
                          <td className="p-3.5 sm:p-4">
                            <p className="font-semibold text-amber-200 text-xs truncate max-w-[180px]">{order.watchTitle}</p>
                            <p className="text-xs text-[#DCAA4A] font-bold">{order.watchPrice}</p>
                          </td>
                          
                          {/* 🟢 Status Badge */}
                          <td className="p-3.5 sm:p-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              order.status === "Delivered" || order.status === "Verified"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : order.status === "Dispatched"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}>
                              {order.status || "Pending"}
                            </span>
                          </td>

                          {/* 🟢 View Details aur Delete Buttons */}
                          <td className="p-3.5 sm:p-4 text-right whitespace-nowrap space-x-2">
                            <button 
                              onClick={() => setSelectedOrderDetails(order)}
                              className="text-xs bg-[#DCAA4A] text-black px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(220,170,74,0.25)] cursor-pointer"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => handleDeleteOrder(order._id)}
                              className="text-xs border border-red-500/40 text-red-400 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 4. CUSTOMER ACCOUNTS TAB */}
              {activeTab === "logins" && (
                <motion.div key="logins" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
                    <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider mb-4 sm:mb-6 border-b border-neutral-900 pb-3 sm:pb-4">
                      Customer Profiles & Cart Synchronizations
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                      {users.map((user) => (
                        <div key={user._id} className="bg-neutral-900/40 border border-neutral-800 p-3.5 sm:p-4 rounded-xl flex items-center gap-3.5">
                          <img 
                            src={user.image || "/wClassic.png"} 
                            alt={user.name} 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-amber-500/40 object-cover flex-shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-xs sm:text-sm truncate">{user.name}</p>
                            <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                            <span className="text-xs bg-neutral-800 text-amber-400 px-2 py-0.5 rounded font-mono mt-1 inline-block">
                              Cart: {user.cart?.length || 0} items
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}
        </div>
      </main>

      {/* ================= MODAL: CLIENT DOSSIER ================= */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              className="bg-neutral-950 border border-amber-500/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-5 sm:space-y-6 relative"
            >
              <div className="flex justify-between items-start border-b border-neutral-800 pb-3 sm:pb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#DCAA4A] bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    Order #{selectedOrderDetails._id?.slice(-6)}
                  </span>
                  <h3 className="text-base sm:text-xl font-bold text-white mt-2">
                    Client: {selectedOrderDetails.name}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Placed: {formatDateTime(selectedOrderDetails.createdAt)}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedOrderDetails(null)} 
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-xs sm:text-sm">
                <div className="bg-neutral-900/60 border border-neutral-800/80 p-3.5 sm:p-4 rounded-2xl space-y-2">
                  <h4 className="font-bold text-amber-300 uppercase tracking-wider text-xs">Contact & Shipping</h4>
                  <p><span className="text-neutral-500">Email:</span> <span className="text-white font-medium">{selectedOrderDetails.email || "Not Provided"}</span></p>
                  <p><span className="text-neutral-500">Phone:</span> <span className="text-amber-400 font-mono font-semibold">{selectedOrderDetails.phone}</span></p>
                  <div>
                    <span className="text-neutral-500 block mb-1">Address:</span>
                    <span className="text-neutral-200 block bg-black/40 p-2 sm:p-2.5 rounded-lg border border-neutral-800 text-xs">
                      {selectedOrderDetails.address}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-900/60 border border-neutral-800/80 p-3.5 sm:p-4 rounded-2xl space-y-2">
  <h4 className="font-bold text-amber-300 uppercase tracking-wider text-xs">Payment & Items Ordered</h4>
  <p><span className="text-neutral-500">Items:</span> <span className="text-amber-100 font-bold block">{selectedOrderDetails.watchTitle}</span></p>
  <p><span className="text-neutral-500">Total Bill:</span> <span className="text-lg sm:text-xl text-[#DCAA4A] font-extrabold">{selectedOrderDetails.watchPrice}</span></p>
  <p><span className="text-neutral-500">Gateway:</span> <span className="text-neutral-300 font-mono font-semibold uppercase">{selectedOrderDetails.paymentMethod}</span></p>
                  
                  <div className="pt-2">
                    <label className="text-xs text-neutral-400 uppercase tracking-wider block mb-1">Update Status:</label>
                    <select
                      value={selectedOrderDetails.status || "Pending"}
                      onChange={(e) => handleStatusChange(selectedOrderDetails._id, e.target.value)}
                      className="w-full bg-black border border-amber-500/40 text-amber-300 rounded-lg p-2 font-bold outline-none cursor-pointer text-xs sm:text-sm"
                    >
                      <option value="Pending">Pending Verification</option>
                      <option value="Verified">Payment Verified</option>
                      <option value="Dispatched">Dispatched For Courier</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              </div>

              {selectedOrderDetails.screenshotUrl && (
                <div className="border border-neutral-800 rounded-2xl p-3.5 sm:p-4 bg-neutral-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedOrderDetails.screenshotUrl} 
                      alt="Receipt"
                      width={12}
                      height={12}
                      loading="lazy"
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-neutral-700" 
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white">Payment Receipt</p>
                      <p className="text-xs text-neutral-400">Click to view full receipt</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPreviewReceipt(selectedOrderDetails.screenshotUrl)} 
                    className="w-full sm:w-auto text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-2 rounded-xl font-bold hover:bg-amber-500 hover:text-black transition-colors cursor-pointer text-center"
                  >
                    Expand Receipt 🔍
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: ADD WATCH ================= */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-neutral-950 border border-amber-500/40 w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-7 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-amber-300 uppercase tracking-wider">
                  Add New Watch
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-500 hover:text-white cursor-pointer text-sm">✕</button>
              </div>

              <form onSubmit={handleAddWatchSubmit} className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Watch Title</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. SKELETON TITANIUM 1954" 
                    value={newWatch.title} 
                    onChange={(e) => setNewWatch({ ...newWatch, title: e.target.value })} 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 sm:py-2.5 text-white focus:border-amber-400 outline-none text-xs sm:text-sm" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Sale Price (PKR)</label>
                    <input 
                      required 
                      type="number" 
                      placeholder="e.g. 28000" 
                      value={newWatch.price} 
                      onChange={(e) => setNewWatch({ ...newWatch, price: e.target.value })} 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 sm:py-2.5 text-white focus:border-amber-400 outline-none text-xs sm:text-sm" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Main Collection</label>
                  <select 
  value={newWatch.collectionName} 
  onChange={(e) => setNewWatch({ 
    ...newWatch, 
    collectionName: e.target.value,
    category: e.target.value 
  })} 
  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-bold outline-none text-xs sm:text-sm"
>
  <option value="featured"> Home Page (Featured Cards)</option>
  <option value="freshdrop">Fresh Drop</option>
  <option value="men">Men</option>
  <option value="women">Women</option>
  <option value="smart">Smart Watches</option>
  <option value="couples">Couples</option>
</select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

  <div>
    <label className="block text-neutral-400 mb-1 font-medium">Original Cut Price (PKR)</label>
    <input 
      type="number" 
      placeholder="e.g. 2600" 
      value={newWatch.originalPrice} 
      onChange={(e) => setNewWatch({ ...newWatch, originalPrice: e.target.value })} 
      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white outline-none" 
    />
  </div>
  <div>
  <label className="block text-neutral-400 mb-1 font-medium">Initial Inventory Stock</label>
  <input 
    required 
    type="number" 
    min="0"
    placeholder="e.g. 15" 
    value={newWatch.stock} 
    onChange={(e) => setNewWatch({ ...newWatch, stock: Number(e.target.value) })} 
    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white outline-none" 
  />
</div>
</div>

{/* Rating aur Reviews Count */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>
    <label className="block text-neutral-400 mb-1 font-medium">Star Rating (e.g. 4.9)</label>
    <input 
      type="number" 
      step="0.1" 
      min="1" 
      max="5"
      placeholder="4.9" 
      value={newWatch.rating} 
      onChange={(e) => setNewWatch({ ...newWatch, rating: e.target.value })} 
      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white outline-none" 
    />
  </div>

  <div>
    <label className="block text-neutral-400 mb-1 font-medium">Total Reviews</label>
    <input 
      type="number" 
      placeholder="e.g. 45" 
      value={newWatch.reviews} 
      onChange={(e) => setNewWatch({ ...newWatch, reviews: e.target.value })} 
      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white outline-none" 
    />
  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Sub-Category</label>
                    <select 
                      value={newWatch.subCategory} 
                      onChange={(e) => setNewWatch({ ...newWatch, subCategory: e.target.value })} 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 sm:py-2.5 text-white focus:border-amber-400 outline-none font-bold text-xs sm:text-sm"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Chronograph">Chronograph</option>
                      <option value="Steel Edition">Steel Edition</option>
                      <option value="Leather Strap">Leather Strap</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1 font-medium">Badge Tag</label>
                    <input 
                      type="text" 
                      placeholder="e.g. NEW or Bestseller" 
                      value={newWatch.tag} 
                      onChange={(e) => setNewWatch({ ...newWatch, tag: e.target.value })} 
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 sm:py-2.5 text-white focus:border-amber-400 outline-none text-xs sm:text-sm" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Specification Note</label>
                  <input 
                    type="text" 
                    placeholder="e.g. TACHYMETER SCALE / SAPPHIRE GLASS" 
                    value={newWatch.spec} 
                    onChange={(e) => setNewWatch({ ...newWatch, spec: e.target.value })} 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 sm:py-2.5 text-white focus:border-amber-400 outline-none text-xs sm:text-sm" 
                  />
                </div>

             <div>
                  <label className="block text-neutral-400 mb-1 font-medium">Watch Image Upload</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (file) {
                        const img = document.createElement("img");
                        const reader = new FileReader();

                        reader.onload = (event) => {
                          img.src = event.target.result;
                          img.onload = () => {
                            // Canvas se image resize & compress karein
                            const canvas = document.createElement("canvas");
                            const MAX_WIDTH = 1000;
                            const scaleSize = MAX_WIDTH / img.width;
                            canvas.width = Math.min(img.width, MAX_WIDTH);
                            canvas.height = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

                            const ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                            // High-quality compressed lightweight Base64
                            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
                            setNewWatch((prev) => ({ ...prev, imageBase64: compressedBase64 }));
                          };
                        };
                        reader.readAsDataURL(file);
                      }
                    }} 
                    className="w-full text-neutral-400 file:mr-3 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-400 hover:file:bg-amber-500/30 cursor-pointer" 
                  />
                </div>
               <div>
  <label className="block text-neutral-400 mb-1 font-medium">
    View Details Description (Modal Text)
  </label>
  <textarea 
    rows={3}
    placeholder="Write details shown when customer clicks 'View Details'..." 
    value={newWatch.description} 
    onChange={(e) => setNewWatch({ ...newWatch, description: e.target.value })} 
    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white focus:border-amber-400 outline-none text-xs sm:text-sm resize-none" 
  />
</div>

                <button 
                  type="submit" 
                  className="w-full mt-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black py-2.5 sm:py-3 rounded-full font-bold uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer text-xs sm:text-sm"
                >
                  Save Watch To Database
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: RECEIPT PREVIEW ================= */}
      <AnimatePresence>
        {previewReceipt && (
          <div 
            onClick={() => setPreviewReceipt(null)} 
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          >
            <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-amber-500/40 p-2 bg-neutral-950">
              <img src={previewReceipt} alt="Receipt" className="w-full h-full object-contain rounded-xl" />
              <button className="absolute top-3 right-3 bg-black/80 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-white/20 text-xs sm:text-sm">✕</button>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}