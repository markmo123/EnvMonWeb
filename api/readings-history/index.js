const { app } = require("@azure/functions");
const { getContainer } = require("../shared/cosmos");

app.http("readings-history", {
  methods: ["GET"],
  route: "readings/history",
  authLevel: "anonymous",
  handler: async (request, context) => {
    const deviceId = request.query.get("deviceId") || "default";
    const limitParam = request.query.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam) || 50, 1), 500);

    try {
      const container = getContainer();

      const query = {
        query:
          "SELECT * FROM c WHERE c.deviceId = @deviceId ORDER BY c.timestamp DESC OFFSET 0 LIMIT @limit",
        parameters: [
          { name: "@deviceId", value: deviceId },
          { name: "@limit", value: limit },
        ],
      };

      const { resources } = await container.items
        .query(query, { enableCrossPartitionQuery: false })
        .fetchAll();

      // Return in ascending order so charts render left-to-right
      const readings = resources.reverse().map((r) => ({
        id: r.id,
        deviceId: r.deviceId,
        temperature: r.temperature,
        humidity: r.humidity,
        light: r.light,
        timestamp: r.timestamp,
      }));

      return {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          count: readings.length,
          deviceId,
          readings,
        }),
      };
    } catch (err) {
      context.error("Failed to fetch history:", err);
      return {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Failed to fetch history" }),
      };
    }
  },
});
