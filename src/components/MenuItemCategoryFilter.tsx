"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Category = { id: string; name: string };

export default function MenuItemCategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);

  const currentCategoryId = searchParams.get("where[category][equals]");

  useEffect(() => {
    fetch("/api/menu-categories?limit=100&sort=name", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setCategories(data.docs ?? []))
      .catch(() => {});
  }, []);

  const setFilter = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set("where[category][equals]", categoryId);
    } else {
      params.delete("where[category][equals]");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  if (categories.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        padding: "0 0 16px 0",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => setFilter(null)}
        style={buttonStyle(!currentCategoryId)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => setFilter(cat.id)}
          style={buttonStyle(currentCategoryId === cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

function buttonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "4px 14px",
    borderRadius: "4px",
    border: "1px solid var(--theme-border-color)",
    background: active ? "var(--theme-elevation-150)" : "transparent",
    color: "var(--theme-text)",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    fontSize: "13px",
  };
}
