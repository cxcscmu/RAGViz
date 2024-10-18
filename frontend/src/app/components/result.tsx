"use client";
import { Answer } from "@/app/components/answer";
// import { Relates } from "@/app/components/relates";
import { Sources } from "@/app/components/sources";
import { Relate } from "@/app/interfaces/relate";
import { Source } from "@/app/interfaces/source";
import { parseRAG } from "@/app/utils/parse-rag";
import { Annoyed } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { parseRewrite } from "../utils/parse-rewrite";

export const Result: FC<{
  query: string;
  rid: string;
  k: string;
  apiKey: string;
  snippet: string;
  modal: boolean;
  setModal: any;
}> = ({ query, rid, k, apiKey, snippet, modal, setModal }) => {
  const [sources, setSources] = useState<Source[]>([]);
  const [token, setToken] = useState<number[] | null>(null);
  const [clicked, setClicked] = useState<number[] | null>(null);
  const [tokenLength, setTokenLength] = useState<number>(0);
  const [markdown, setMarkdown] = useState<string[]>([]);
  const [markdownCompare, setMarkdownCompare] = useState<string[]>([]);
  const [compare, setCompare] = useState<boolean>(false);
  const [relates, setRelates] = useState<Relate[] | null>(null);
  const [error, setError] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void parseRAG(
      controller,
      query,
      rid,
      k,
      apiKey,
      snippet,
      setSources,
      setMarkdown,
      setTokenLength,
      setError,
    );
    return () => {
      controller.abort();
    };
  }, [query]);

  const rewrite = (keep: boolean[][][]) => {
    const controller = new AbortController();
    setCompare(true);
    setMarkdownCompare([]);
    setToken([]);
    void parseRewrite(
      controller,
      query,
      sources,
      keep,
      rid,
      k,
      tokenLength,
      apiKey,
      snippet,
      setSources,
      setMarkdown,
      setMarkdownCompare,
      setError,
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <Answer
        markdown={markdown}
        compare={compare}
        sources={sources}
        markdownCompare={markdownCompare}
        token={token}
        tokenLength={tokenLength}
        setToken={setToken}
        clicked={clicked}
        setClicked={setClicked}
      ></Answer>
      <Sources sources={sources} token={token} rewrite={rewrite}></Sources>
      {error && (
        <div className="absolute inset-4 flex items-center justify-center bg-white/40 backdrop-blur-sm">
          <div className="p-4 bg-white shadow-2xl rounded text-blue-500 font-medium flex gap-4">
            <Annoyed></Annoyed>
            {error === 429
              ? "Sorry, you have made too many requests recently, try again later."
              : "Sorry, we might be overloaded, try again later."}
          </div>
        </div>
      )}
      {modal && (
        <div className="absolute inset-4 flex max-w-3xl m-auto items-center justify-center bg-opacity-50">
          <div className="p-4 bg-white rounded text-black font-medium flex flex-col gap-4">
            <p>
              1. Hover over tokens in the Answer section to see the attention
              visualization for that generated token. If you want to lock that
              visualization or visualize multiple tokens, simply drag.
            </p>

            <p>
              2. Remove documents by clicking the buttons, and remove tokens by
              dragging.
            </p>

            <p>
              3. Press &quot;Save and Rewrite&quot; to see the new generation.
            </p>

            <div
              className="cursor-pointer px-full py-1 border border-blue-500 text-blue-500 hover:bg-blue-100 rounded-md text-xs text-center mt-auto"
              onClick={() => setModal(false)}
            >
              Close Instructions
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
