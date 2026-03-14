import { defineConfig } from "prisma/config";
import { getPrismaSqliteUrl } from "./src/lib/runtime-paths";

export default defineConfig({
  datasource: {
    url: getPrismaSqliteUrl(),
  },
});
