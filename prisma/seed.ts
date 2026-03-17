import { runImport } from "../src/services/importService";

async function main() {
  console.log("🌱 Начало seed из существующих данных...\n");
  await runImport();
}

main().catch((err) => {
  console.error("Ошибка seed:", err);
  process.exit(1);
});
