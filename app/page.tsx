import Image from "next/image";
import HomePage from "./collections/home/page.js";
import { headers } from "next/headers.js";
import { redirect } from "next/navigation.js";

export default async function Home() {
const headerlist = await headers();
const userAgent =headerlist.get("user-agent") || "";

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);


if (isMobile) {
    // Mobile user hai toh /collections/home par bhej do
    redirect('/collections/home');
  } else {
    // Desktop user hai toh /collections/wrist-watches par bhej do
    redirect('/collections/wrist-watches');
  }



  // Desktop user hai toh /collections/wrist-watches par bhej do

  
  
  return (
    <></>
  );
}
