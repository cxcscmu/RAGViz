import { Source } from "@/app/interfaces/source";

export const parseRAG = async (
  controller: AbortController,
  query: string,
  search_uuid: string,
  k: string,
  apiKey: string,
  snippet: string,
  onSources: (value: Source[]) => void,
  onMarkdown: (value: string[]) => void,
  onTokenLength: (value: number) => void,
  onError?: (status: number) => void,
) => {
  const url = `${process.env.NEXT_PUBLIC_BASE_PATH}/query.cgi?query=${encodeURIComponent(query)}&search_uuid=${encodeURIComponent(search_uuid)}&k=${encodeURIComponent(k)}&api_key=${encodeURIComponent(apiKey)}&snippet=${encodeURIComponent(snippet)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    signal: controller.signal,
  });

  if (response.status !== 200) {
    onError?.(response.status);
    return;
  }
  response
    .json()
    .then((data) => {
      console.log(data);
      onTokenLength(JSON.parse(data).docs[0].attn.length);
      onSources(JSON.parse(data).docs);
      onMarkdown(JSON.parse(data).answer);
    })
    .catch((error) => {
      console.error("Error fetching RAG backend:", error);
      onSources([]);
    });
};
