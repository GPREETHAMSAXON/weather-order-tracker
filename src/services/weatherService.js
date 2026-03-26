/**
 * Weather Service Module
 * Fetches current weather data from OpenWeatherMap API
 */

const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Fetch weather for a single city
 * @param {string} city - City name
 * @param {string} apiKey - OpenWeatherMap API key
 * @returns {Promise<{city: string, weather: string, description: string, temp: number}>}
 */
export async function fetchWeather(city, apiKey) {
  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Weather API error for "${city}": ${response.status} — ${errorBody.message || response.statusText}`
    );
  }

  const data = await response.json();

  return {
    city: data.name,
    weather: data.weather[0].main,        // e.g. "Rain", "Clear", "Snow"
    description: data.weather[0].description, // e.g. "heavy rain"
    temp: data.main.temp,                  // temperature in °C
  };
}

/**
 * Fetch weather for multiple cities concurrently using Promise.allSettled
 * This ensures one failed city (e.g. InvalidCity123) doesn't crash the others
 *
 * @param {Array<{order_id: string, city: string}>} orders
 * @param {string} apiKey
 * @returns {Promise<Map<string, {status: 'ok'|'error', data?: object, error?: string}>>}
 */
export async function fetchWeatherForAllOrders(orders, apiKey) {
  console.log(`\n🌍 Fetching weather for ${orders.length} cities concurrently...\n`);

  const results = await Promise.allSettled(
    orders.map((order) => fetchWeather(order.city, apiKey))
  );

  const weatherMap = new Map();

  results.forEach((result, index) => {
    const order = orders[index];

    if (result.status === "fulfilled") {
      weatherMap.set(order.order_id, {
        status: "ok",
        data: result.value,
      });
      console.log(
        `  ✅ ${order.city}: ${result.value.weather} (${result.value.description}, ${result.value.temp}°C)`
      );
    } else {
      weatherMap.set(order.order_id, {
        status: "error",
        error: result.reason.message,
      });
      console.error(`  ❌ ${order.city}: ${result.reason.message}`);
    }
  });

  return weatherMap;
}