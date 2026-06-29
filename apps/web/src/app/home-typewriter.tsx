"use client";

import { useEffect, useState } from "react";

type HomeTypewriterProps = {
  text: string;
};

export function HomeTypewriter({ text }: HomeTypewriterProps) {
  const [visibleText, setVisibleText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    setVisibleText("");
    setIsComplete(false);

    timeoutId = setTimeout(() => {
      let index = 0;

      intervalId = setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));

        if (index >= text.length) {
          if (intervalId) {
            clearInterval(intervalId);
          }

          timeoutId = setTimeout(() => {
            setIsComplete(true);
          }, 280);
        }
      }, 52);
    }, 120);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [text]);

  return (
    <div className="max-w-full overflow-visible bg-transparent text-left">
      <style>
        {`
          @keyframes homeTypewriterCursorBlink {
            0%, 49% {
              opacity: 1;
            }

            50%, 100% {
              opacity: 0;
            }
          }
        `}
      </style>

      <div
        className="home-typewriter-line inline-flex max-w-[calc(100vw-2.5rem)] items-baseline overflow-visible bg-transparent text-white drop-shadow-[0_18px_44px_rgba(0,0,0,0.62)] sm:max-w-[calc(100vw-3rem)] lg:max-w-[calc(100vw-5rem)]"
        aria-label={text}
      >
        <span className="inline-block overflow-visible whitespace-nowrap bg-transparent">
          {visibleText}
        </span>

        {!isComplete ? (
          <span
            aria-hidden="true"
            className="ml-[0.025em] inline-block shrink-0 bg-transparent text-white"
            style={{
              animation: "homeTypewriterCursorBlink 0.8s step-end infinite",
              lineHeight: 1,
            }}
          >
            |
          </span>
        ) : null}
      </div>
    </div>
  );
}
