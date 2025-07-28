"use client";

import dynamic from "next/dynamic";
const MainApp = dynamic(() => import("./MainApp"), { ssr: false });

export default function Home() {
  return <MainApp />;
}
