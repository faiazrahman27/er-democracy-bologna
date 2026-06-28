"use client";

import { useEffect, useState } from "react";

export function HomeTypewriter({ text }: { text: string }) {
  const [shownText, setShownText] = useState("");

  useEffect(() => {
    let index = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    function typeNextLetter() {
      setShownText(text.slice(0, index));

      if (index <= text.length) {
        index += 1;
        timeoutId = setTimeout(typeNextLetter, 58);
        return;
      }

      timeoutId = setTimeout(() => {
        index = 0;
        setShownText("");
        timeoutId = setTimeout(typeNextLetter, 260);
      }, 1200);
    }

    typeNextLetter();

    return () => clearTimeout(timeoutId);
  }, [text]);

  return (
    <div
      className="inline-flex max-w-full items-center bg-transparent text-left text-[clamp(1.7rem,7vw,4.75rem)] font-black uppercase leading-none tracking-[-0.055em] text-white"
      aria-label={text}
    >
      <span className="min-h-[1em] break-words bg-transparent">
        {shownText}
      </span>

      <span
        aria-hidden="true"
        className="ml-[0.08em] inline-block h-[1em] w-[0.075em] min-w-[4px] self-center bg-white"
        style={{
          animation: "typewriterCursorBlink 0.72s ease-in-out infinite",
        }}
      />

      <style>
        {`
          @keyframes typewriterCursorBlink {
            0%, 48% {
              opacity: 1;
            }

            49%, 100% {
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}
