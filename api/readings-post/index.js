const { app } = require("@azure/functions");
const { getContainer } = require("../shared/cosmos");
const { validateApiKey } = require("../shared/auth");

app.http("readings-post", {
  methods: ["POST"],
  route: "readings",
  authLevel: "anonymous",
  handler: async (request, context) => {
    // Validate API key
    if (!validateApiKey(request)) {
      return {
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Unauthorized: invalid or missing x-api-key header" }),
      };
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid JSON body" }),
      };
    }

    // Validate required fields
    const { temperature, humidity, light, deviceId } = body;

    if (temperature === undefined || humidity === undefined || light === undefined) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing required fields: temperature, humidity, light",
        }),
      };
    }

    // Type checks
    if (
      typeof temperature !== "number" ||
      typeof humidity !== "number" ||
      typeof light !== "number"
    ) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "temperature, humidity, and light must be numbers" }),
      };
    }

    // Sanity range checks
    if (temperature < -100 || temperature > 200) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "temperature out of valid range (-100 to 200)" }),
      };
    }
    if (humidity < 0 || humidity > 100) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "humidity out of valid range (0 to 100)" }),
      };
    }
    if (light < 0 || light > 200000) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "light out of valid range (0 to 200000 lux)" }),
      };
    }

    // Build the document
    const timestamp = new Date().toISOString();
    const document = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceId: deviceId || "default",
      temperature: Number(temperature.toFixed(2)),
      humidity: Number(humidity.toFixed(2)),
      light: Math.round(light),
      timestamp,
      _ts: Math.floor(Date.now() / 1000),
    };

    try {
      const container = getContainer();
      const { resource } = await container.items.create(document);

      context.log(`Reading saved: ${resource.id} at ${timestamp}`);

      return {
        status: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resource.id,
          timestamp: resource.timestamp,
          temperature: resource.temperature,
          humidity: resource.humidity,
          light: resource.light,
          deviceId: resource.deviceId,
        }),
      };
    } catch (err) {
      context.error("Failed to save reading:", err);
      return {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Failed to save reading" }),
      };
    }
  },
});
