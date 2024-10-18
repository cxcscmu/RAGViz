import { Skeleton } from "@/app/components/skeleton";
import { Wrapper } from "@/app/components/wrapper";
import { Source } from "@/app/interfaces/source";
import { BookText } from "lucide-react";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";

const SourceItem: FC<{
  source: Source;
  index: number;
  token: number[] | null;
  keep: boolean[][][];
  setKeep: Dispatch<SetStateAction<boolean[][][]>>;
}> = ({ source, index, token, keep, setKeep }) => {
  const { id, url, nameTokens, snippetTokens, attn } = source;
  const domain = new URL(url).hostname;
  const highlight = (score: number | null) =>
    score == null || score < 0.1
      ? ""
      : score >= 0.1 && score <= 0.2
        ? "bg-red-100"
        : score > 0.2 && score <= 0.4
          ? "bg-red-200"
          : score > 0.4 && score <= 0.6
            ? "bg-red-300"
            : score > 0.6 && score <= 0.8
              ? "bg-red-400"
              : "bg-red-500"; // Default shade
  const handleRemoveDocument = (set: boolean) => () => {
    const newKeep = [...keep];
    newKeep[index] = [
      newKeep[index][0].map(() => set),
      newKeep[index][1].map(() => set),
    ];
    setKeep(newKeep);
  };

  const handleDragStart =
    (tokenIndex: number, name: boolean) =>
    (event: React.DragEvent<HTMLDivElement>) => {
      // event.preventDefault(); // Prevent text selection
      // event.dataTransfer.setData("text/plain", String(index));
      // if (!event.target.classList.contains("allow-drag")) {
      // event.target.classList.add("select-none");
      // event.preventDefault();
      // }
      // event.dataTransfer.dropEffect = "move";
      const newKeep = [...keep];
      console.log(tokenIndex);
      const nameSnippet = name ? 0 : 1;
      newKeep[index][nameSnippet][tokenIndex] = false;
      setKeep(newKeep);
    };
  const handleDrop =
    (tokenIndex: number, name: boolean) =>
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    };

  const handleDragKeep =
    (tokenIndex: number, name: boolean) =>
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.setData("text/plain", String(index));
      const newKeep = [...keep];
      console.log(tokenIndex);
      const nameSnippet = name ? 0 : 1;
      newKeep[index][nameSnippet][tokenIndex] = false;
      setKeep(newKeep);
    };

  return (
    <div className="grid grid-cols-5 gap-2" key={id}>
      <div className="flex flex-col col-span-1 rounded-lg py-3 px-3">
        <p className="text-sm">Attention score:</p>
        <h2 className="text-xl font-medium mb-2">
          {token == null ||
          !token.map((t) => attn[t]) ||
          token.length <= 0 ||
          attn[token[0]] == null
            ? "None"
            : (
                Math.round(
                  token
                    .map((t) => attn[t].score)
                    .reduce((acc, curr) => acc + curr) * 1000,
                ) /
                (1000 * token.length)
              ).toFixed(3)}
        </h2>
        <div className="h-full">
          <div
            className="mb-2 cursor-pointer px-full py-1 border border-blue-500 text-blue-500 hover:bg-blue-100 rounded-md text-xs text-center mt-auto"
            onClick={handleRemoveDocument(true)}
          >
            Add All Tokens
          </div>
          <div
            className="cursor-pointer px-full py-1 border border-blue-500 text-blue-500 hover:bg-blue-100 rounded-md text-xs text-center mt-auto"
            onClick={handleRemoveDocument(false)}
          >
            Remove All Tokens
          </div>
        </div>
      </div>
      <div
        className={`relative text-xs py-3 px-3 rounded-lg flex flex-col gap-2 col-span-4`}
      >
        {/* <a href={url} target="_blank" className="absolute inset-0"></a> */}
        <div className="font-medium text-zinc-950 text-lg text-ellipsis break-words">
          {nameTokens.map((str, tokenIndex) => (
            <span
              key={tokenIndex}
              draggable
              onDragStart={handleDragStart(tokenIndex, true)}
              // onDrop={handleDrop(tokenIndex, true)}
              onDragOver={handleDragKeep(tokenIndex, true)}
              className={`${highlight(
                token &&
                  token.map((t) => attn[t]) &&
                  token.length > 0 &&
                  attn[token[0]] != null
                  ? token
                      .map((t) => attn[t].name[tokenIndex] * 1000)
                      .reduce((acc, curr) => acc + curr) / token.length
                  : null,
              )} ${keep[index] && keep[index][0][tokenIndex] ? "opacity-100" : "opacity-50"} cursor-pointer`}
            >
              {str}
            </span>
          ))}
        </div>

        <div className="font-medium text-zinc-950 text-ellipsis break-words">
          {snippetTokens.map((str, tokenIndex) => (
            <span
              key={tokenIndex}
              draggable
              onDragStart={handleDragStart(tokenIndex, false)}
              onDrop={handleDrop(tokenIndex, false)}
              onDragOver={handleDragKeep(tokenIndex, false)}
              className={`${highlight(
                token &&
                  token.map((t) => attn[t]) &&
                  token.length > 0 &&
                  attn[token[0]] != null
                  ? token
                      .map((t) => attn[t].snippet[tokenIndex] * 1000)
                      .reduce((acc, curr) => acc + curr) / token.length
                  : null,
              )} ${keep[index] && keep[index][1][tokenIndex] ? "opacity-100" : "opacity-50"} cursor-pointer`}
            >
              {str}
            </span>
          ))}
        </div>

        {/* <div className="flex gap-2 items-center">
          <div className="flex-1 overflow-hidden">
            <div className="text-ellipsis whitespace-nowrap break-all text-zinc-950 overflow-hidden w-full">
              {index + 1} - {domain}
            </div>
          </div>
          <div className="flex-none flex items-center">
            <img
              className="h-3 w-3"
              alt={domain}
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${16}`}
            />
          </div>
        </div> */}
      </div>
    </div>
  );
};

function deepCopyArray(arr: any): any {
  if (!Array.isArray(arr)) {
    return arr; // If it's not an array, return the value
  }

  return arr.map((element) => deepCopyArray(element)); // Recursively copy each element
}

export const Sources: FC<{
  sources: Source[];
  token: number[] | null;
  rewrite: (keep: boolean[][][]) => void;
}> = ({ sources, token, rewrite }) => {
  const [keep, setKeep]: [
    boolean[][][],
    Dispatch<SetStateAction<boolean[][][]>>,
  ] = useState([] as boolean[][][]);
  const [oldKeep, setOldKeep]: [
    boolean[][][],
    Dispatch<SetStateAction<boolean[][][]>>,
  ] = useState([] as boolean[][][]);

  const handleSave = () => {
    setOldKeep(deepCopyArray(keep));
    rewrite(keep);
  };

  const handleCancel = () => {
    // const newKeep = [...oldKeep];
    setKeep(deepCopyArray(oldKeep));
  };

  useEffect(() => {
    // This code will run only once, immediately after the component mounts
    setKeep(
      sources.map((source) => [
        source.nameTokens.map(() => true),
        source.snippetTokens.map(() => true),
      ]),
    );
    setOldKeep(
      sources.map((source) => [
        source.nameTokens.map(() => true),
        source.snippetTokens.map(() => true),
      ]),
    );
  }, [sources.length]);
  return (
    <Wrapper
      title={
        <>
          <div className="flex flex-row items-center gap-2">
            <BookText></BookText> Sources
            {!(JSON.stringify(oldKeep) === JSON.stringify(keep)) && (
              <>
                <div
                  className="ml-3 border border-blue-300 px-4 py-0.5  text-xs rounded-md cursor-pointer hover:bg-blue-300"
                  onClick={handleSave}
                >
                  Save and Rewrite
                </div>
                <div
                  className="ml-1 border border-red-300 px-4 py-0.5 rounded-md text-xs cursor-pointer hover:bg-red-300 text-red-500"
                  onClick={handleCancel}
                >
                  Cancel
                </div>
              </>
            )}
          </div>
        </>
      }
      content={
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
          {sources.length > 0 ? (
            sources.map((item, index) => (
              <SourceItem
                key={item.id}
                index={index}
                source={item}
                token={token}
                keep={keep}
                setKeep={setKeep}
              ></SourceItem>
            ))
          ) : (
            <>
              <Skeleton className="max-w-sm h-16 bg-zinc-200/80"></Skeleton>
              <Skeleton className="max-w-sm h-16 bg-zinc-200/80"></Skeleton>
              <Skeleton className="max-w-sm h-16 bg-zinc-200/80"></Skeleton>
              <Skeleton className="max-w-sm h-16 bg-zinc-200/80"></Skeleton>
            </>
          )}
        </div>
      }
    ></Wrapper>
  );
};
