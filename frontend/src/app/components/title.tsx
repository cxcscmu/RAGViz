"use client";
import { RefreshCcw } from "lucide-react";
import { nanoid } from "nanoid";
// import { getSearchUrl } from "@/app/utils/get-search-url";
// import { RefreshCcw } from "lucide-react";
// import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { getSearchUrl } from "../utils/get-search-url";
import { BookText } from "lucide-react";

export const Title = ({
  query,
  k,
  apiKey,
  snippet,
  setModal,
}: {
  query: string;
  k: string;
  apiKey: string;
  snippet: string;
  setModal: any;
}) => {
  const router = useRouter();
  return (
    <div className="flex items-center pb-4 mb-6 border-b gap-4">
      <div
        className="flex-1 text-lg sm:text-xl text-black text-ellipsis overflow-hidden whitespace-nowrap"
        title={query}
      >
        {query}
      </div>
      <button
        onClick={() => setModal(true)}
        type="button"
        className="rounded flex gap-2 items-center bg-transparent px-2 py-1 text-xs font-semibold text-blue-500 hover:bg-zinc-100"
      >
        <BookText size={12}></BookText>Instructions
      </button>
      <div className="flex-none">
        <button
          onClick={() => {
            router.push(
              getSearchUrl(
                encodeURIComponent(query),
                nanoid(),
                encodeURIComponent(k),
                encodeURIComponent(apiKey),
                encodeURIComponent(snippet),
              ),
            );
          }}
          type="button"
          className="rounded flex gap-2 items-center bg-transparent px-2 py-1 text-xs font-semibold text-blue-500 hover:bg-zinc-100"
        >
          <RefreshCcw size={12}></RefreshCcw>Rewrite
        </button>
      </div>
    </div>
  );
};
