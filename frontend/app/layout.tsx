import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title:       "Urban Risk Intelligence Platform",
  description: "AI-powered real-time urban safety monitoring — Indore",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-[#0B0F1A] text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  )
}