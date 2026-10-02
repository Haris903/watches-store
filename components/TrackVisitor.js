"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function TrackVisitor() {
  const pathname = usePathname();
  const trackedPath = useRef("");

  useEffect(() => {
    // Admin dashboard ki apni visits track na hon
    if (pathname.startsWith("/admin")) return;
    if (trackedPath.current === pathname) return;

    trackedPath.current = pathname;

    // Browser ke liye ek unique ID generate/fetch karein
    let visitorId = localStorage.getItem("store_visitor_id");
    if (!visitorId) {
      visitorId = "vis_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("store_visitor_id", visitorId);
    }

    // Server ko ping bhej dein
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, page: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}