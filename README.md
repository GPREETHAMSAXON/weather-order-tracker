# 🌦️ Weather-Aware Order Delay Tracker

**Yellow.ai — Automation Intern Assignment 2**

An intelligent Node.js script that monitors weather conditions for pending delivery orders and automatically flags potential delays. When bad weather is detected, it generates personalized apology messages using Google Gemini AI.

---

## 🏗️ Architecture

```
weather-order-tracker/
├── data/
│   ├── orders.json              # Input: original orders
│   └── orders_updated.json      # Output: processed orders with statuses
├── src/
│   ├── index.js                 # Entry point — orchestrates the full workflow
│   └── services/
│       ├── weatherService.js    # OpenWeatherMap API integration
│       ├── aiService.js         # Groq/Llama AI integration
│       └── orderProcessor.js    # Core "Golden Flow" delay logic
├── .env.example                 # Template for environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ (uses native `fetch`)
- **OpenWeatherMap API Key** (free) → [Get one here](https://openweathermap.org/api)
- **Groq API Key** (free) → [Get one here](https://console.groq.com)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/weather-order-tracker.git
cd weather-order-tracker

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your API keys

# 4. Run the tracker
npm start
```

---

## ⚙️ How It Works — The "Golden Flow"

1. **Load Orders** → Reads `data/orders.json`
2. **Concurrent Weather Fetch** → Fires API calls for ALL cities simultaneously using `Promise.allSettled`
3. **Delay Logic** → If weather is `Rain`, `Snow`, `Extreme`, or `Thunderstorm` → status becomes `Delayed`
4. **AI Apology** → Google Gemini generates a personalized delay notification for each affected customer
5. **Error Resilience** → Invalid cities (like `InvalidCity123`) are caught and logged without crashing the script
6. **Output** → Updated orders saved to `data/orders_updated.json` with a summary report printed to console

---

## 🛡️ Resilience & Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid city name | `Promise.allSettled` catches the rejected promise; order marked as `Error` with details logged |
| AI service failure | Fallback template message is used; script continues |
| Missing API keys | Validated at startup with clear error messages |
| Network timeout | Fetch errors are caught per-city; other cities still process |

**Key Design Choice:** `Promise.allSettled` (not `Promise.all`) ensures that one failing city never crashes the entire batch. Every order gets processed regardless of individual failures.

---

## 🔐 Security

- API keys are stored in `.env` (gitignored) — **never hardcoded**
- `.env.example` provided as a template for collaborators
- No sensitive data committed to version control

---

## 📝 AI Log

### Prompts Used During Development

**1. Parallel Fetching Strategy**
> "How should I structure concurrent API calls in Node.js so that one failure doesn't crash the others?"
>
> **Decision:** Used `Promise.allSettled` over `Promise.all` because `allSettled` resolves when ALL promises complete (fulfilled or rejected), giving us per-city error handling instead of fail-fast behavior.

**2. Error Handling Architecture**
> "What's the best pattern for handling mixed success/failure results from concurrent API calls?"
>
> **Decision:** Each result from `Promise.allSettled` has a `status` field (`fulfilled` or `rejected`). We map results by order_id into a `weatherMap`, tagging each as `ok` or `error`, so downstream processing can branch cleanly.

**3. AI Apology Message Generation**
> "Generate a short, warm, personalized apology message for a delivery delay caused by weather. Use the customer's first name, mention the specific weather condition, and keep it to 2-3 sentences."
>
> **Decision:** Used Google Gemini (gemini-2.0-flash) with a structured prompt that includes customer name, city, and weather details. Added a fallback template in case the AI service is unavailable.

---

## 📸 Sample Output

```
🚀 Weather-Aware Order Delay Tracker
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Gemini AI initialized
📦 Loaded 4 orders from orders.json

🌍 Fetching weather for 4 cities concurrently...

  ✅ New York: Clear (clear sky, 18°C)
  ✅ Mumbai: Rain (moderate rain, 28°C)
  ✅ London: Clouds (overcast clouds, 12°C)
  ❌ InvalidCity123: Weather API error for "InvalidCity123": 404 — city not found

⚙️  Processing orders through Golden Flow logic...

  ✅ Order 1001 (New York): On Track (Clear)
  🛑 Order 1002 (Mumbai): DELAYED due to Rain
     📩 AI Message: "Hi Bob, we wanted to let you know ..."

  ✅ Order 1003 (London): On Track (Clouds)
  ⚠️  Order 1004 (InvalidCity123): Marked as Error

════════════════════════════════════════════════════════════
  📊  SUMMARY REPORT
════════════════════════════════════════════════════════════
  Total Orders:    4
  On Track:        2
  Delayed:         1
  Errors:          1
════════════════════════════════════════════════════════════
```

*(Actual weather results will vary based on real-time conditions)*

---

## 📄 License

MIT
