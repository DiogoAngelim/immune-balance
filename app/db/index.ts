// Re-export DB from backend for Next.js API usage
console.log("APP DB connection string:", process.env.DATABASE_URL);
export * from "../../backend/src/db/index";
