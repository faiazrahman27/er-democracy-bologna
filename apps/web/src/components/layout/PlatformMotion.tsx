"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const platformMotionStyles = `
  .platform-motion-ready .platform-reveal {
    opacity: 0;
    transform: translate3d(0, 32px, 0) scale(0.985);
    filter: blur(8px);
    transition:
      opacity 720ms cubic-bezier(0.2, 0.72, 0.18, 1),
      transform 720ms cubic-bezier(0.2, 0.72, 0.18, 1),
      filter 720ms cubic-bezier(0.2, 0.72, 0.18, 1);
    will-change: opacity, transform, filter;
  }

  .platform-motion-ready .platform-reveal.platform-reveal-visible {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: blur(0);
  }

  @media (max-width: 760px) {
    .platform-motion-ready .platform-reveal {
      opacity: 0;
      transform: translate3d(0, 42px, 0) scale(0.975);
      filter: blur(7px);
      transition:
        opacity 680ms cubic-bezier(0.2, 0.72, 0.18, 1),
        transform 680ms cubic-bezier(0.2, 0.72, 0.18, 1),
        filter 680ms cubic-bezier(0.2, 0.72, 0.18, 1);
    }

    .platform-motion-ready .platform-reveal.platform-reveal-visible {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
      filter: blur(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .platform-motion-ready .platform-reveal,
    .platform-motion-ready .platform-reveal.platform-reveal-visible {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
      transition: none !important;
      will-change: auto !important;
    }
  }
`;

const revealSelector = [
  "main h1",
  "main h2",
  "main h3",
  "main p",
  "main article",
  "main aside",
  "main form",
  "main img",
  "main .grid > *",
  "main [data-platform-reveal]",
  "footer section > *",
  "footer img",
].join(", ");

function isUsableElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  if (element.closest('[data-no-platform-motion="true"]')) {
    return false;
  }

  return true;
}

function isInMotionRange(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;

  return rect.top < viewportHeight * 0.94 && rect.bottom > viewportHeight * 0.06;
}

export default function PlatformMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let observer: IntersectionObserver | null = null;
    let scheduledFrame = 0;
    const timers: number[] = [];
    const revealElements = new Set<HTMLElement>();

    root.classList.add("platform-motion-ready");

    function setVisibility(element: HTMLElement) {
      if (isInMotionRange(element)) {
        element.classList.add("platform-reveal-visible");
      } else {
        element.classList.remove("platform-reveal-visible");
      }
    }

    function prepareElement(element: HTMLElement) {
      if (revealElements.has(element)) {
        return;
      }

      if (!isUsableElement(element)) {
        return;
      }

      revealElements.add(element);
      element.classList.add("platform-reveal");

      if (prefersReducedMotion.matches) {
        element.classList.add("platform-reveal-visible");
        return;
      }

      observer?.observe(element);
      setVisibility(element);
    }

    function scanPage() {
      scheduledFrame = 0;

      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(revealSelector),
      );

      elements.forEach((element) => {
        prepareElement(element);
      });

      revealElements.forEach((element) => {
        setVisibility(element);
      });
    }

    function scheduleScan() {
      if (scheduledFrame) {
        return;
      }

      scheduledFrame = window.requestAnimationFrame(scanPage);
    }

    if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const target = entry.target as HTMLElement;

            if (entry.isIntersecting) {
              target.classList.add("platform-reveal-visible");
            } else {
              target.classList.remove("platform-reveal-visible");
            }
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -2% 0px",
          threshold: 0.01,
        },
      );
    }

    [0, 80, 220, 500, 1000, 1800].forEach((delay) => {
      const timer = window.setTimeout(scheduleScan, delay);
      timers.push(timer);
    });

    window.addEventListener("scroll", scheduleScan, { passive: true });
    window.addEventListener("touchmove", scheduleScan, { passive: true });
    window.addEventListener("resize", scheduleScan);
    window.addEventListener("orientationchange", scheduleScan);
    window.addEventListener("pageshow", scheduleScan);

    return () => {
      observer?.disconnect();

      if (scheduledFrame) {
        window.cancelAnimationFrame(scheduledFrame);
      }

      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });

      window.removeEventListener("scroll", scheduleScan);
      window.removeEventListener("touchmove", scheduleScan);
      window.removeEventListener("resize", scheduleScan);
      window.removeEventListener("orientationchange", scheduleScan);
      window.removeEventListener("pageshow", scheduleScan);

      revealElements.forEach((element) => {
        element.classList.remove("platform-reveal", "platform-reveal-visible");
      });

      revealElements.clear();
      root.classList.remove("platform-motion-ready");
    };
  }, [pathname]);

  return <style dangerouslySetInnerHTML={{ __html: platformMotionStyles }} />;
}
