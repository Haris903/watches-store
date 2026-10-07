'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function LoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef(null);

  // Route switch hone par trigger
  useEffect(() => {
    if (!visible) return;

    // Minimum display time (450ms) taake user ko deliberate luxury animation nazar aaye
    const MIN_DURATION = 450;
    const elapsed = Date.now() - startTimeRef.current;
    const remainingTime = Math.max(0, MIN_DURATION - elapsed);

    timeoutRef.current = setTimeout(() => {
      // Step 1: Bar ko 100% complete par snap karo
      setFinishing(true);

      // Step 2: Smooth opacity fade-out karke unmount karo
      setTimeout(() => {
        setVisible(false);
        setFinishing(false);
      }, 250);
    }, remainingTime);

    return () => clearTimeout(timeoutRef.current);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleLinkClick = (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      // Hash (#products), phone, mail ya external links skip karein
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.target === '_blank'
      ) {
        return;
      }

      // Same current page click ignore
      const currentUrl = window.location.pathname + window.location.search;
      const targetUrl = new URL(link.href, window.location.href);
      const targetPath = targetUrl.pathname + targetUrl.search;
      if (currentUrl === targetPath) return;

      // Click hote hi timer aur loading active
      startTimeRef.current = Date.now();
      setFinishing(false);
      setVisible(true);
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[9999999] h-[3px] w-full overflow-hidden bg-amber-500/10 pointer-events-none transition-opacity duration-300 ease-out ${
        finishing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className="h-full bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#E11D48] shadow-[0_0_14px_#D97706] transition-all duration-300 ease-out"
        style={{
          width: finishing ? '100%' : '80%',
          animation: finishing ? 'none' : 'farooshGlide 1.1s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes farooshGlide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(15%); }
          100% { transform: translateX(110%); }
        }
      `}} />
    </div>
  );
}

export default function RouteLoader() {
  return (
    <Suspense fallback={null}>
      <LoaderContent />
    </Suspense>
  );
}