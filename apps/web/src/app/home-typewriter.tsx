"use client";

import { useEffect, useState } from "react";

export function HomeTypewriter({ text }: { text: string }) {
  const [shownText, setShownText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    setShownText("");
    setShowCursor(true);

    function typeNextLetter() {
      index += 1;
      setShownText(text.slice(0, index));

      if (index < text.length) {
        timeoutId = setTimeout(typeNextLetter, 58);
        return;
      }

      timeoutId = setTimeout(() => {
        setShowCursor(false);
      }, 420);
    }

    timeoutId = setTimeout(typeNextLetter, 260);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [text]);

  return (
    <div
      className="inline-flex max-w-full items-baseline bg-transparent text-left font-mono text-[clamp(1.35rem,5.4vw,4.35rem)] font-black uppercase leading-none tracking-[-0.065em] text-white drop-shadow-[0_12px_34px_rgba(0,0,0,0.58)]"
      aria-label={text}
    >
      <span className="min-h-[1em] max-w-[calc(100vw-4rem)] overflow-visible whitespace-nowrap bg-transparent">
        {shownText}
      </span>

      {showCursor ? (
        <span
          aria-hidden="true"
          className="ml-[0.06em] inline-block shrink-0 bg-transparent leading-none text-white"
        >
          |
        </span>
      ) : null}
    </div>
  );
}
