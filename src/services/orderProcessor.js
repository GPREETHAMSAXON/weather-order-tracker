/**
 * Order Processor Module
 * Core "Golden Flow" logic — checks weather and updates order statuses
 */

import { generateApologyMessage } from "./aiService.js";

// Weather conditions that trigger a delivery delay
const DELAY_CONDITIONS = new Set(["Rain", "Snow", "Extreme", "Thunderstorm", "Haze", "Drizzle", "Smoke"]);

/**
 * Process all orders against weather data and update statuses
 *
 * @param {Array} orders - The orders array from orders.json
 * @param {Map} weatherMap - Weather results mapped by order_id
 * @returns {Promise<{updatedOrders: Array, delayedOrders: Array, errorOrders: Array}>}
 */
export async function processOrders(orders, weatherMap) {
  const delayedOrders = [];
  const errorOrders = [];

  console.log("\n⚙️  Processing orders through Golden Flow logic...\n");

  for (const order of orders) {
    const weatherResult = weatherMap.get(order.order_id);

    // Case 1: Weather fetch failed (e.g. InvalidCity123)
    if (!weatherResult || weatherResult.status === "error") {
      order.status = "Error";
      order.notes = weatherResult?.error || "Weather data unavailable";
      errorOrders.push(order);
      console.log(
        `  ⚠️  Order ${order.order_id} (${order.city}): Marked as Error — ${order.notes}`
      );
      continue;
    }

    const { weather, description } = weatherResult.data;

    // Case 2: Bad weather — mark as Delayed + generate AI apology
    if (DELAY_CONDITIONS.has(weather)) {
      order.status = "Delayed";
      order.weather = `${weather} — ${description}`;

      try {
        order.apology_message = await generateApologyMessage(
          order.customer,
          order.city,
          weather,
          description
        );
        console.log(
          `  🛑 Order ${order.order_id} (${order.city}): DELAYED due to ${weather}`
        );
        console.log(`     📩 AI Message: "${order.apology_message}"\n`);
      } catch (aiError) {
        // If AI fails, use a fallback template — script must not crash
        order.apology_message = `Hi ${order.customer.split(" ")[0]}, your order to ${order.city} is delayed due to ${description}. We appreciate your patience!`;
        console.log(
          `  🛑 Order ${order.order_id} (${order.city}): DELAYED (AI fallback used)`
        );
      }

      delayedOrders.push(order);
      continue;
    }

    // Case 3: Good weather — keep as Pending (on track)
    order.status = "On Track";
    order.weather = `${weather} — ${description}`;
    console.log(
      `  ✅ Order ${order.order_id} (${order.city}): On Track (${weather})`
    );
  }

  return { updatedOrders: orders, delayedOrders, errorOrders };
}