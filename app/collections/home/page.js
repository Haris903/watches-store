"use client";

import React, { useState, useEffect, useLayoutEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function HomePage(){
  const router = useRouter();
  
  
   useLayoutEffect(() => {
    const userAgent = navigator.userAgent || window.opera;
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (!isMobileDevice) {
      router.replace("/collections/wrist-watches");
    } 
  }, [router]);

  return(
    <>
    <div></div>
    
    </>
  )
}