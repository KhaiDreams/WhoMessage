import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Whomessage",
  description: "Social Media for Gamers",
  icons: {
    icon: [
      { url: "/assets/logo-removebg-preview.png", type: "image/png", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" }
    ],
    shortcut: "/favicon.ico",
    apple: "/assets/logo-removebg-preview.png"
  },
  openGraph: {
    title: "Whomessage",
    description: "Social Media for Gamers",
    images: [
      {
        url: "/assets/logo-removebg-preview.png",
        width: 1200,
        height: 630,
        alt: "WhoMessage Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Whomessage",
    description: "Social Media for Gamers",
    images: [
      "/assets/logo-removebg-preview.png"
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}
