"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function LocalizerVisibility({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const isSiteContent = pathname?.includes("/collections/site-content");
    document.documentElement.classList.toggle("show-localizer", Boolean(isSiteContent));
  }, [pathname]);

  return <>{children}</>;
}
