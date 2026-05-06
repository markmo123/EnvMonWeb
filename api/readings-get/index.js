const { app } = require("@azure/functions");
const { getContainer } = require("../shared/cosmos");

app.http("readings-latest", {
  methods: ["GET"],
  route: "readings/latest",
  authLevel: "anonymous",
  handler: async (request, context) => {
    const deviceId = request.query.get("deviceId") || "default";

    try {
      const container = getContainer();

      const query = {
        query:
          "SELECT TOP 1 * FROM c WHERE c.deviceId = @deviceId ORDER BY c.timestamp DESC",
        parameters: [{ name: "@deviceId", value: deviceId }],
      };

      const { resources } = await container.items
        .query(query, { enableCrossPartitionQuery: false })
        .fetchAll();

      if (resources.length === 0) {
        return {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ error: "No readings found" }),
        };
      }

      const reading = resources[0];

      return {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          id: reading.id,
          deviceId: reading.deviceId,
          temperature: reading.temperature,
          humidity: reading.humidity,
          light: reading.light,
          timestamp: reading.timestamp,
        }),
      };
    } catch (err) {
      context.error("Failed to fetch latest reading:", err);
      return {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Failed to fetch reading" }),
      };
    }
  },
});
