# IoT Sensor Dashboard

A real-time dashboard for temperature, humidity, and light sensor data, hosted on Azure using free-tier resources.

## Architecture

| Service | Purpose | Tier |
|---|---|---|
| Azure Static Web Apps | Frontend React dashboard | Free |
| Azure Functions | REST API for data ingestion & query | Flex Consumption |
| Azure Cosmos DB | Sensor data storage | Free (1000 RU/s) |
| GitHub Actions | CI/CD pipeline | Free |

## API Reference

### Submit a reading (from your IoT device)

```http
POST https://<your-functions-url>/api/readings
x-api-key: <your-api-key>
Content-Type: application/json

{
  "temperature": 23.4,
  "humidity": 58.2,
  "light": 420
}
```

### Get latest reading

```http
GET https://<your-functions-url>/api/readings/latest
```

### Get reading history (last N readings)

```http
GET https://<your-functions-url>/api/readings/history?limit=50
```

## Setup

### Prerequisites

- Azure account (free tier)
- GitHub account
- Node.js 24+

### 1. Create Azure Resources

```bash
# Login
az login

# Create resource group
az group create --name iot-dashboard-rg --location australiaeast

# Create Cosmos DB (serverless - pay per request, no idle cost)
az cosmosdb create \
  --name iot-dashboard-cosmos \
  --resource-group iot-dashboard-rg \
  --capabilities EnableServerless \
  --default-consistency-level Session

# Create Cosmos DB database and container
az cosmosdb sql database create \
  --account-name iot-dashboard-cosmos \
  --resource-group iot-dashboard-rg \
  --name SensorDB

az cosmosdb sql container create \
  --account-name iot-dashboard-cosmos \
  --resource-group iot-dashboard-rg \
  --database-name SensorDB \
  --name Readings \
  --partition-key-path "/deviceId"

# Create Storage Account for Functions
az storage account create \
  --name iotdashboardstorage$RANDOM \
  --resource-group iot-dashboard-rg \
  --location australiaeast \
  --sku Standard_LRS

# Create a blob container for Flex Consumption deployment artifacts
az storage container create \
  --name deploymentartifacts \
  --account-name iotdashboardstorage

# Create Function App (Flex Consumption plan)
az functionapp create \
  --name iot-dashboard-api \
  --resource-group iot-dashboard-rg \
  --runtime node \
  --runtime-version 24 \
  --flexconsumption-location australiaeast \
  --storage-account iotdashboardstorage \
  --deployment-storage-container-name deploymentartifacts

# Create Static Web App (do this via Azure Portal or CLI after pushing to GitHub)
# az staticwebapp create \
#   --name iot-dashboard-web \
#   --resource-group iot-dashboard-rg \
#   --source https://github.com/<your-org>/<your-repo> \
#   --location australiaeast \
#   --branch main \
#   --app-location "/frontend" \
#   --output-location "dist"
```

### 2. Configure GitHub Secrets

Add these secrets in your GitHub repository (Settings → Secrets → Actions):

| Secret | Where to find it |
|---|---|
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Azure Portal → Function App → Get publish profile |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Created automatically when you link Static Web App to GitHub |
| `COSMOS_CONNECTION_STRING` | Azure Portal → Cosmos DB → Keys → Primary Connection String |
| `API_KEY` | Generate a secure random string (used to authenticate device submissions) |
| `VITE_API_BASE_URL` | Your Function App URL, e.g. https://iot-dashboard-api.azurewebsites.net |

### 3. Set Function App Settings

```bash
# Get your Cosmos DB connection string
COSMOS_CONN=$(az cosmosdb keys list \
  --name iot-dashboard-cosmos \
  --resource-group iot-dashboard-rg \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv)

# Set app settings on Function App
# Note: Flex Consumption uses az functionapp config appsettings set the same way
az functionapp config appsettings set \
  --name iot-dashboard-api \
  --resource-group iot-dashboard-rg \
  --settings \
    COSMOS_CONNECTION_STRING="$COSMOS_CONN" \
    COSMOS_DATABASE="SensorDB" \
    COSMOS_CONTAINER="Readings" \
    API_KEY='your-generated-api-key-here'
```

### 4. Deploy

Push to `main` branch — GitHub Actions handles the rest.

## Local Development

```bash
# API (Azure Functions)
cd api
npm install
cp local.settings.example.json local.settings.json
# Fill in local.settings.json with your values
npm start

# Frontend
cd frontend
npm install
npm run dev
```

## Sending Test Data

```bash
curl -X POST https://<your-functions-url>/api/readings \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"temperature": 22.5, "humidity": 60.1, "light": 380}'
```
