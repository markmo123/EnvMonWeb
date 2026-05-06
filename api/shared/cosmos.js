const { CosmosClient } = require("@azure/cosmos");

let client = null;
let container = null;

function getContainer() {
  if (container) return container;

  const connectionString = process.env.COSMOS_CONNECTION_STRING;
  const databaseName = process.env.COSMOS_DATABASE || "SensorDB";
  const containerName = process.env.COSMOS_CONTAINER || "Readings";

  if (!connectionString) {
    throw new Error("COSMOS_CONNECTION_STRING environment variable is not set");
  }

  client = new CosmosClient(connectionString);
  container = client.database(databaseName).container(containerName);
  return container;
}

module.exports = { getContainer };
