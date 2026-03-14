import { runImport, runImportForSource } from "../src/services/importService";

const arg = process.argv[2];

async function main() {
  if (!arg || arg === "all") {
    const result = await runImport();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (arg === "afimilk" || arg === "dtm" || arg === "aic") {
    const result = await runImportForSource(arg);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  throw new Error(`Unknown source '${arg}'. Use: afimilk | dtm | aic | all`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const prismaModule = await import("../src/lib/prisma");
    await prismaModule.default.$disconnect();
  });
