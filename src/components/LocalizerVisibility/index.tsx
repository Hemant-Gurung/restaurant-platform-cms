"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function LocalizerVisibility({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const isSiteContent = pathname?.includes("/collections/site-content");

    // Hide/show localizer
    const apply = () => {
      document.querySelectorAll<HTMLElement>(".localizer").forEach((el) => {
        el.style.display = isSiteContent ? "" : "none";
      });
    };
    apply();
    const t = setTimeout(apply, 300);

    // Sync ?locale URL param with the payload-lng cookie when on SiteContent
    if (isSiteContent) {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)payload-lng=([^;]+)/);
      const cookieLang = cookieMatch?.[1];
      if (cookieLang) {
        const url = new URL(window.location.href);
        if (url.searchParams.get("locale") !== cookieLang) {
          url.searchParams.set("locale", cookieLang);
          window.history.replaceState(null, "", url.toString());
        }
      }
    }

    return () => clearTimeout(t);
  }, [pathname]);

  return <>{children}</>;
}
