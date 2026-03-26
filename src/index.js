/**
 * Weather-Aware Order Delay Tracker
 * ===================================
 * Yellow.ai Automation Intern Assignment
 *
 * Golden Flow:
 *   1. Load orders from orders.json
 *   2. Fetch weather for all cities CONCURRENTLY (Promise.allSettled)
 *   3. Apply delay logic (Rain/Snow/Extreme → Delayed)
 *   4. Generate AI apology messages via Google Gemini
 *   5. Save updated orders to orders_updated.json
 *   6. Print summary report
 */

import "dotenv/config";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { fetchWeatherForAllOrders } from "./services/weatherService.js";
import { initAI } from "./services/aiService.js";
import { processOrders } from "./services/orderProcessor.js";

// ── Resolve paths ──────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "data");
const INPUT_FILE = join(DATA_DIR, "orders.json");
const OUTPUT_FILE = join(DATA_DIR, "orders_updated.json");

// ── Validate environment ──────────────────────────────────
function validateEnv() {
  const { OPENWEATHER_API_KEY, GROQ_API_KEY } = process.env;

  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY.includes("your_")) {
    console.error("❌ Missing OPENWEATHER_API_KEY in .env file");
    console.error("   Get one free at: https://openweathermap.org/api");
    process.exit(1);
  }

  if (!GROQ_API_KEY || GROQ_API_KEY.includes("your_")) {
    console.error("❌ Missing GROQ_API_KEY in .env file");
    console.error("   Get one free at: https://console.groq.com");
    process.exit(1);
  }

  return { OPENWEATHER_API_KEY, GROQ_API_KEY };
}

// ── Print summary report ──────────────────────────────────
function printSummary(updatedOrders, delayedOrders, errorOrders) {
  console.log("\n" + "═".repeat(60));
  console.log("  📊  SUMMARY REPORT");
  console.log("═".repeat(60));
  console.log(`  Total Orders:    ${updatedOrders.length}`);
  console.log(`  On Track:        ${updatedOrders.length - delayedOrders.length - errorOrders.length}`);
  console.log(`  Delayed:         ${delayedOrders.length}`);
  console.log(`  Errors:          ${errorOrders.length}`);
  console.log("═".repeat(60));

  if (delayedOrders.length > 0) {
    console.log("\n  🛑 Delayed Orders:");
    delayedOrders.forEach((o) => {
      console.log(`     • ${o.order_id} | ${o.customer} → ${o.city} | ${o.weather}`);
    });
  }

  if (errorOrders.length > 0) {
    console.log("\n  ⚠️  Error Orders:");
    errorOrders.forEach((o) => {
      console.log(`     • ${o.order_id} | ${o.customer} → ${o.city} | ${o.notes}`);
    });
  }

  console.log("\n" + "═".repeat(60) + "\n");
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 Weather-Aware Order Delay Tracker");
  console.log("━".repeat(45));

  // Step 0: Validate environment variables
  const { OPENWEATHER_API_KEY, GROQ_API_KEY } = validateEnv();

  // Step 1: Initialize AI service
  initAI(GROQ_API_KEY);
  console.log("🤖 Gemini AI initialized");

  // Step 2: Load orders
  const rawData = await readFile(INPUT_FILE, "utf-8");
  const orders = JSON.parse(rawData);
  console.log(`📦 Loaded ${orders.length} orders from orders.json`);

  // Step 3: Fetch weather CONCURRENTLY for all cities
  const weatherMap = await fetchWeatherForAllOrders(orders, OPENWEATHER_API_KEY);

  // Step 4: Process orders (apply delay logic + AI apology generation)
  const { updatedOrders, delayedOrders, errorOrders } = await processOrders(
    orders,
    weatherMap
  );

  // Step 5: Save updated orders
  await writeFile(OUTPUT_FILE, JSON.stringify(updatedOrders, null, 2), "utf-8");
  console.log(`\n💾 Updated orders saved to: data/orders_updated.json`);

  // Step 6: Print summary
  printSummary(updatedOrders, delayedOrders, errorOrders);
}

// ── Run with top-level error handling ─────────────────────
main().catch((err) => {
  console.error("\n💥 Fatal error:", err.message);
  process.exit(1);
});