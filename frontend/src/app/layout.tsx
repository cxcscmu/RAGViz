import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RAGViz",
  description:
    "Answer generated by large language models (LLMs). Double check for correctness.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" /> {/* Adding the favicon */}
        <title>RAGViz</title> {/* Using metadata title */}
        <meta
          name="description"
          content="Answer generated by large language models (LLMs). Double check for correctness."
        />{" "}
        {/* Using metadata description */}
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}