/**
 * AI Service Module
 * Generates personalized weather-aware apology messages using Groq (Llama)
 */

import Groq from "groq-sdk";

let groq = null;

/**
 * Initialize the Groq client
 * @param {string} apiKey - Groq API key
 */
export function initAI(apiKey) {
  groq = new Groq({ apiKey });
}

/**
 * Generate a personalized weather-aware apology message
 *
 * @param {string} customerName - Customer's name
 * @param {string} city - Delivery city
 * @param {string} weatherCondition - Weather condition (e.g. "Rain", "Snow")
 * @param {string} weatherDescription - Detailed weather description (e.g. "heavy rain")
 * @returns {Promise<string>} - The generated apology message
 */
export async function generateApologyMessage(
  customerName,
  city,
  weatherCondition,
  weatherDescription
) {
  if (!groq) {
    throw new Error("AI not initialized. Call initAI(apiKey) first.");
  }

  const chatCompletion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a friendly customer support assistant for a delivery company. Write short, warm apology messages (2-3 sentences max). Output ONLY the message text.",
      },
      {
        role: "user",
        content: `Write a personalized apology for this delayed delivery:
- Customer Name: ${customerName}
- Delivery City: ${city}
- Weather Condition: ${weatherCondition} (${weatherDescription})

Address the customer by first name only. Mention the specific weather naturally. Be empathetic but concise.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 150,
  });

  return chatCompletion.choices[0].message.content.trim();
}