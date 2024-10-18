"use client";
import { Result } from "@/app/components/result";
import { Search } from "@/app/components/search";
import { Title } from "@/app/components/title";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = decodeURIComponent(searchParams.get("q") || "");
  const rid = decodeURIComponent(searchParams.get("rid") || "");
  const k = decodeURIComponent(searchParams.get("k") || "5");
  const apiKey = decodeURIComponent(searchParams.get("api_key") || "");
  const snippet = decodeURIComponent(searchParams.get("snippet") || "first");
  const [modal, setModal] = useState(false);
  return (
    <div className="absolute inset-0 bg-[url('/ui/bg.svg')]">
      <div className="mx-auto absolute inset-4 md:inset-8 bg-white">
        <div className="h-20 pointer-events-none rounded-t-2xl w-full backdrop-filter absolute top-0 bg-gradient-to-t from-transparent to-white [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        <div className="px-4 md:px-8 pt-6 pb-48 rounded-2xl ring-8 ring-zinc-300/20 border border-zinc-200 h-full overflow-auto">
          <Title
            query={query}
            k={k}
            apiKey={apiKey}
            snippet={snippet}
            setModal={setModal}
          ></Title>
          <Result
            key={rid}
            query={query}
            rid={rid}
            k={k}
            apiKey={apiKey}
            snippet={snippet}
            modal={modal}
            setModal={setModal}
          ></Result>
        </div>
        <div className="h-80 pointer-events-none w-full rounded-b-2xl backdrop-filter absolute bottom-0 bg-gradient-to-b from-transparent to-white [mask-image:linear-gradient(to_top,white,transparent)]"></div>
        <div className="absolute z-10 flex items-center justify-center bottom-6 px-4 md:px-8 w-full">
          <div className="w-full">
            <Search defK={k} apiKey={apiKey} defSnippet={snippet}></Search>
          </div>
        </div>
      </div>
    </div>
  );
}
