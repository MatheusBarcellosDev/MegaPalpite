// Prisma config for Next.js
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://postgres.vhzpmcdpmmlftkdrgaak:45Rf66rf66rf%40@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  },
});
