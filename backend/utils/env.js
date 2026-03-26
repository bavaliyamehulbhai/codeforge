function validateEnv() {
  const required = [];
  if (process.env.NODE_ENV === "production") {
    required.push("JWT_SECRET", "MONGODB_URI", "CORS_ORIGINS");
  }

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}

function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGINS || "";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

module.exports = { validateEnv, getAllowedOrigins };
