"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const platformMotionStyles = `
  .platform-motion-ready .platform-reveal {
    opacity: 0;
    transform: translate3d(0, 34px, 0) scale(0.985);
    filter: blur(8px);
    transition:
      opacity 760ms cubic-bezier(0.2, 0.72, 0.18, 1),
      transform 760ms cubic-bezier(0.2, 0.72, 0.18, 1),
      filter 760ms cubic-bezier(0.2, 0.72, 0.18, 1);
    will-change: opacity, transform, filter;
  }

  .platform-motion-ready .platform-reveal.platform-reveal-visible {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
    filter: blur(0);
  }

  @media (max-width: 760px) {
    .platform-motion-ready .platform-reveal {
      transform: translate3d(0, 24px, 0) scale(0.99);
      filter: blur(6px);
      transition:
        opacity 620ms cubic-bezier(0.2, 0.72, 0.18, 1),
        transform 620ms cubic-bezier(0.2, 0.72, 0.18, 1),
        filter 620ms cubic-bezier(0.2, 0.72, 0.18, 1);
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
  "main > section",
  "main > article",
  "main > div",
  "main section",
  "main article",
  "main aside",
  "main header",
  "main form",
  "main .grid > *",
  "main [data-platform-reveal]",
  "footer > section",
  "footer section > div",
].join(", ");

function isUsableElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

function isInsideViewport(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;

  return rect.top < viewportHeight * 0.96 && rect.bottom > viewportHeight * 0.04;
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
    const revealElements = new Set<HTMLElement>();
    const timers: number[] = [];

    root.classList.add("platform-motion-ready");

    function prepareElement(element: HTMLElement) {
      if (revealElements.has(element)) {
        return;
      }

      if (!isUsableElement(element)) {
        return;
      }

      if (element.closest('[data-no-platform-motion="true"]')) {
        return;
      }

      revealElements.add(element);
      element.classList.add("platform-reveal");

      if (prefersReducedMotion.matches || !observer) {
        element.classList.add("platform-reveal-visible");
        return;
      }

      observer.observe(element);

      if (isInsideViewport(element)) {
        window.requestAnimationFrame(() => {
          element.classList.add("platform-reveal-visible");
        });
      }
    }

    function scanPage() {
      scheduledFrame = 0;

      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(revealSelector),
      );

      elements.forEach((element) => {
        prepareElement(element);
      });
    }

    function scheduleScan() {
      if (scheduledFrame) {
        return;
      }

      scheduledFrame = window.requestAnimationFrame(scanPage);
    }

    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
      observer = null;
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const target = entry.target as HTMLElement;

            if (entry.isIntersecting || entry.intersectionRatio > 0) {
              target.classList.add("platform-reveal-visible");
            } else {
              target.classList.remove("platform-reveal-visible");
            }
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -4% 0px",
          threshold: 0.01,
        },
      );
    }

    [0, 80, 220, 500, 1000, 1800].forEach((delay) => {
      const timer = window.setTimeout(scheduleScan, delay);
      timers.push(timer);
    });

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
