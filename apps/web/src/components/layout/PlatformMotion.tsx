"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const platformMotionStyles = `
  .platform-motion-ready .platform-reveal {
    opacity: 0;
    transform: translate3d(0, 28px, 0);
    filter: blur(8px);
    transition:
      opacity 720ms cubic-bezier(0.2, 0.72, 0.18, 1),
      transform 720ms cubic-bezier(0.2, 0.72, 0.18, 1),
      filter 720ms cubic-bezier(0.2, 0.72, 0.18, 1);
    will-change: opacity, transform, filter;
  }

  .platform-motion-ready .platform-reveal.platform-reveal-visible {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    filter: blur(0);
  }

  @media (max-width: 760px) {
    .platform-motion-ready .platform-reveal {
      transform: translate3d(0, 18px, 0);
      filter: blur(5px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .platform-motion-ready .platform-reveal,
    .platform-motion-ready .platform-reveal.platform-reveal-visible {
      opacity: 1;
      transform: none;
      filter: none;
      transition: none;
      will-change: auto;
    }
  }
`;

const revealSelector = [
  "main > section",
  "main > article",
  "main > div",
  "main section > header",
  "main section > article",
  "main section > aside",
  "main section > form",
  "main section > div",
  "main .grid > *",
  "footer > section",
  "footer section > div",
].join(", ");

function isVisibleElement(element: HTMLElement) {
  const rect = element.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

export default function PlatformMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let scheduledFrame = 0;

    root.classList.remove("platform-motion-ready");
    root.classList.add("platform-motion-ready");

    const revealElements = new Set<HTMLElement>();

    function makeVisible(element: HTMLElement) {
      element.classList.add("platform-reveal-visible");
    }

    function prepareElement(element: HTMLElement) {
      if (revealElements.has(element)) {
        return;
      }

      if (!isVisibleElement(element)) {
        return;
      }

      if (element.closest('[data-no-platform-motion="true"]')) {
        return;
      }

      revealElements.add(element);
      element.classList.add("platform-reveal");

      if (prefersReducedMotion.matches || !observer) {
        makeVisible(element);
        return;
      }

      observer.observe(element);
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
            if (!entry.isIntersecting) {
              return;
            }

            const target = entry.target as HTMLElement;
            target.classList.add("platform-reveal-visible");
            observer?.unobserve(target);
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -12% 0px",
          threshold: 0.08,
        },
      );
    }

    scheduleScan();

    mutationObserver = new MutationObserver(() => {
      scheduleScan();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer?.disconnect();
      mutationObserver?.disconnect();

      if (scheduledFrame) {
        window.cancelAnimationFrame(scheduledFrame);
      }

      revealElements.forEach((element) => {
        element.classList.remove("platform-reveal", "platform-reveal-visible");
      });

      revealElements.clear();
      root.classList.remove("platform-motion-ready");
    };
  }, [pathname]);

  return <style dangerouslySetInnerHTML={{ __html: platformMotionStyles }} />;
}
