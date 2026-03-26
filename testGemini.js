import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

try {
  const result = await model.generateContent("Say hello in one sentence");
  console.log("✅ Gemini works:", result.response.text());
} catch (err) {
  console.error("❌ Gemini error:", err.message);
}