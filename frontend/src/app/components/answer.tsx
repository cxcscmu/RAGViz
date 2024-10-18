import { Skeleton } from "@/app/components/skeleton";
import { Wrapper } from "@/app/components/wrapper";
import { Source } from "@/app/interfaces/source";
import { BookOpenText } from "lucide-react";
import { Dispatch, FC, SetStateAction } from "react";

export const Token: FC<{
  markdown: string;
  index: number;
  token: number[] | null;
  setToken: Dispatch<SetStateAction<number[] | null>>;
  clicked: number[] | null;
  setClicked: Dispatch<SetStateAction<number[] | null>>;
}> = ({ markdown, index, token, setToken, clicked, setClicked }) => {
  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {};

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!token?.includes(index)) {
      const newTokens = token ? [...token, index] : [index];
      setClicked(newTokens);
      setToken(newTokens);
    }
  };

  const handleMouseEnter = () => {
    setToken([index]);
  };

  const className = token?.includes(index)
    ? "bg-red-300 hover:cursor-pointer"
    : "hover:bg-red-200 hover:cursor-pointer";

  const handleMouseLeave = () => {
    setToken(clicked);
  };
  return (
    <span
      draggable
      className={className}
      onClick={handleDragStart}
      onDragOver={handleDragOver}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {markdown}
    </span>
  );
};
export const Answer: FC<{
  markdown: string[];
  compare: boolean;
  markdownCompare: string[];
  sources: Source[];
  token: number[] | null;
  tokenLength: number;
  setToken: Dispatch<SetStateAction<number[] | null>>;
  clicked: number[] | null;
  setClicked: Dispatch<SetStateAction<number[] | null>>;
}> = ({
  markdown,
  compare,
  markdownCompare,
  sources,
  token,
  tokenLength,
  setToken,
  clicked,
  setClicked,
}) => {
  return (
    <Wrapper
      title={
        <>
          <BookOpenText></BookOpenText> Answer
        </>
      }
      content={
        markdown && markdown.length > 0 && compare ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="prose prose-sm text-lg max-w-full p-3 border rounded-md">
              <p className="text-xs">
                Generation using all retrieved documents
              </p>
              {markdown.map((str, index) => (
                <Token
                  key={index}
                  index={index}
                  markdown={str}
                  token={token}
                  setToken={setToken}
                  clicked={clicked}
                  setClicked={setClicked}
                />
              ))}
            </div>
            {markdownCompare && markdownCompare.length > 0 ? (
              <div className="prose prose-sm text-lg max-w-full p-3 border rounded-md">
                <p className="text-xs">
                  Generation on selected documents and tokens
                </p>
                {markdownCompare.map((str, index) => (
                  <Token
                    key={index}
                    index={tokenLength + index}
                    markdown={str}
                    token={token}
                    setToken={setToken}
                    clicked={clicked}
                    setClicked={setClicked}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Skeleton className="max-w-sm h-4 bg-zinc-200"></Skeleton>
                <Skeleton className="max-w-lg h-4 bg-zinc-200"></Skeleton>
                <Skeleton className="max-w-2xl h-4 bg-zinc-200"></Skeleton>
                <Skeleton className="max-w-lg h-4 bg-zinc-200"></Skeleton>
                <Skeleton className="max-w-xl h-4 bg-zinc-200"></Skeleton>
              </div>
            )}
          </div>
        ) : markdown && markdown.length > 0 ? (
          <div className="prose prose-sm text-lg max-w-full p-3 border rounded-md">
            <p className="text-xs">Generation on all retrieved documents</p>
            {markdown.map((str, index) => (
              <Token
                key={index}
                index={index}
                markdown={str}
                token={token}
                setToken={setToken}
                clicked={clicked}
                setClicked={setClicked}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Skeleton className="max-w-sm h-4 bg-zinc-200"></Skeleton>
            <Skeleton className="max-w-lg h-4 bg-zinc-200"></Skeleton>
            <Skeleton className="max-w-2xl h-4 bg-zinc-200"></Skeleton>
            <Skeleton className="max-w-lg h-4 bg-zinc-200"></Skeleton>
            <Skeleton className="max-w-xl h-4 bg-zinc-200"></Skeleton>
          </div>
        )
      }
    ></Wrapper>
  );
};
