"use client";
import { Footer } from "@/app/components/footer";
import { Logo } from "@/app/components/logo";
// import { PresetQuery } from "@/app/components/preset-query";
import { Search } from "@/app/components/search";
import React, { useState } from "react";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  return (
    <div className="absolute inset-0 min-h-[500px] flex items-center justify-center">
      <div className="relative flex flex-col gap-8 px-4 -mt-24">
        <Logo></Logo>
        <label
          className="relative bg-white flex items-center justify-center px-2 gap-2 focus-within:border-zinc-300"
          htmlFor="search-bar"
        >
          <h2>API Key:</h2>
          <input
            id="search-bar"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoFocus
            placeholder="Add your search engine API key..."
            className="pl-5 pr-6 py-2 w-full flex-1 outline-none bg-white border rounded-lg"
          />
        </label>
        <Search defK="5" apiKey={apiKey} defSnippet="first"></Search>

        <Footer></Footer>
      </div>
    </div>
  );
}
