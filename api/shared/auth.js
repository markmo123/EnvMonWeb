/**
 * Validates the x-api-key header against the configured API_KEY env var.
 * Returns true if valid, false otherwise.
 */
function validateApiKey(request) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY environment variable is not configured");
    return false;
  }

  const providedKey = request.headers.get("x-api-key");

  if (!providedKey) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (providedKey.length !== apiKey.length) return false;

  let match = 0;
  for (let i = 0; i < apiKey.length; i++) {
    match |= providedKey.charCodeAt(i) ^ apiKey.charCodeAt(i);
  }

  return match === 0;
}

module.exports = { validateApiKey };
