import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export default db;