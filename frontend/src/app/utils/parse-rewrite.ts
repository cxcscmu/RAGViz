import { Source } from "@/app/interfaces/source";

const LLM_SPLIT = "__LLM_RESPONSE__";
const RELATED_SPLIT = "__RELATED_QUESTIONS__";

function unfilterAndPadAttention(
  attnElement: { name: any; snippet: any; score: any },
  filter: any[],
) {
  const nameAttention = unfilterAndPadSingleArray(attnElement.name, filter[0]);
  const snippetAttention = unfilterAndPadSingleArray(
    attnElement.snippet,
    filter[1],
  );
  return {
    name: nameAttention,
    snippet: snippetAttention,
    score: attnElement.score,
  };
}

// Function to unfilter and pad a single array
function unfilterAndPadSingleArray(
  array: string | any[],
  filter: string | any[],
) {
  let filteredIndex = 0;
  const result = [];

  for (let index = 0; index < filter.length; index++) {
    if (filter[index]) {
      if (filteredIndex < array.length) {
        result.push(array[filteredIndex]);
        filteredIndex++;
      } else {
        result.push(0);
      }
    } else {
      result.push(0);
    }
  }

  return result;
}

export const parseRewrite = async (
  controller: AbortController,
  query: string,
  sources: Source[],
  keep: boolean[][][],
  search_uuid: string,
  k: string,
  tokenLength: number,
  apiKey: string,
  snippet: string,
  onSources: (value: Source[]) => void,
  onMarkdown: (value: string[]) => void,
  onMarkdownCompare: (value: string[]) => void,
  onError?: (status: number) => void,
) => {
  const decoder = new TextDecoder();
  let uint8Array = new Uint8Array();
  let chunks = "";
  let sourcesEmitted = false;
  const filteredIndexes: number[] = [];

  const filteredSources = sources.filter((source, index) => {
    const shouldKeep = [keep[index][0].slice(1, -1), keep[index][1]]
      .flat()
      .some((e) => e == true);
    if (shouldKeep) {
      filteredIndexes.push(index);
    }
    return shouldKeep;
  });

  const newSources = filteredSources.map((source, j) => {
    const originalIndex = filteredIndexes[j];
    return {
      ...source,
      originalIndex,
      name: source.nameTokens
        .filter((_, index) => keep[originalIndex][0][index])
        .join(""),
      snippet: source.snippetTokens
        .filter((_, index) => keep[originalIndex][1][index])
        .join(""),
      nameTokens: source.nameTokens.filter(
        (_, index) => keep[originalIndex][0][index],
      ),
      snippetTokens: source.snippetTokens.filter(
        (_, index) => keep[originalIndex][1][index],
      ),
    };
  });
  const url = `${process.env.NEXT_PUBLIC_BASE_PATH}/rewrite.cgi`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    signal: controller.signal,
    body: JSON.stringify({
      query,
      search_uuid,
      k,
      api_key: apiKey,
      results: newSources,
      snippet,
    }),
  });

  if (response.status !== 200) {
    onError?.(response.status);
    return;
  }
  response
    .json()
    .then((data) => {
      const parsedData = JSON.parse(data);
      const updatedSources = [...sources];
      var next = 0;
      parsedData.docs.forEach((source: Source, index: number) => {
        while (
          next < keep.length &&
          [keep[next][0].slice(1, -1), keep[next][1]]
            .flat()
            .every((e) => e == false)
        ) {
          updatedSources[next].attn = updatedSources[next].attn.slice(
            0,
            tokenLength,
          );
          next++;
        }

        if (next < updatedSources.length) {
          const updatedAttn = source.attn.map(
            (element: any, index: string | number) => {
              return unfilterAndPadAttention(element, keep[next]);
            },
          );

          updatedSources[next].attn = updatedSources[next].attn
            .slice(0, tokenLength)
            .concat(updatedAttn);
          next++;
        } else {
          console.error("Index out of range for updatedSources array");
        }
      });
      onSources(updatedSources);
      onMarkdownCompare(parsedData.answer);
    })
    .catch((error) => {
      console.error("Error fetching sources:", error);
      onSources([]);
    });
};
