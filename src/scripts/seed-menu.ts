// Run with: npx tsx src/scripts/seed-menu.ts
import { readFileSync } from "fs";
import { join } from "path";

const CMS = "http://localhost:3002";
const AUTH = "admins API-Key YOUR_API_KEY_HERE";
const RESTAURANT = "my-restaurant"; // change to your slug

interface MenuItem {
  name: string;
  description: string;
  price: number;
  vatRate: number;
  category: string;
  available?: boolean;
}

interface MenuData {
  categories: string[];
  items: MenuItem[];
}

const menu: MenuData = JSON.parse(
  readFileSync(join(__dirname, "menu.json"), "utf-8")
);

async function seed() {
  // 1. Create categories and build name → id map
  const catMap: Record<string, string> = {};
  for (const name of menu.categories) {
    const res = await fetch(`${CMS}/api/menu-categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: AUTH },
      body: JSON.stringify({ name, restaurant: RESTAURANT }),
    });
    const doc = await res.json();
    if (!doc.doc?.id) {
      console.error("Failed to create category:", name, doc);
      process.exit(1);
    }
    catMap[name] = doc.doc.id;
    console.log(`Category created: ${name} (${doc.doc.id})`);
  }

  // 2. Create items
  for (const item of menu.items) {
    const categoryId = catMap[item.category];
    if (!categoryId) {
      console.error(`Unknown category "${item.category}" for item "${item.name}" — skipping`);
      continue;
    }
    const res = await fetch(`${CMS}/api/menu-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: AUTH },
      body: JSON.stringify({
        name: item.name,
        description: item.description,
        price: item.price,
        vatRate: item.vatRate,
        available: item.available ?? true,
        restaurant: RESTAURANT,
        category: categoryId,
      }),
    });
    const doc = await res.json();
    if (!doc.doc?.id) {
      console.error("Failed to create item:", item.name, doc);
      continue;
    }
    console.log(`Item created: ${item.name} (${doc.doc.id})`);
  }

  console.log("\nDone.");
}

seed().catch(console.error);
