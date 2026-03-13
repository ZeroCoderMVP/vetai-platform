const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

const INITIAL_TEMPLATES = [
  {
    code: "REG-PLEM",
    name: "Отчет о племенной продаже",
    description: "Форма для ФГИС Племенное дело (Реализация племенного молодняка)",
    reportType: "BREEDING",
    authority: "BREEDING_REGISTRY",
    version: "1.0",
    defaultFormat: "XML",
  },
  {
    code: "REG-MILK",
    name: "Отчет по продуктивности (24-СХ)",
    description: "Сведения о состоянии животноводства (Молоко)",
    reportType: "REGULATORY",
    authority: "ROSSTAT",
    version: "1.0",
    defaultFormat: "XLSX",
  },
  {
    code: "VET-EPI",
    name: "Эпизоотическая ситуация",
    description: "Отчет в районную СББЖ по инфекционным заболеваниям",
    reportType: "VETERINARY",
    authority: "VET_SERVICE",
    version: "1.0",
    defaultFormat: "PDF",
  },
  {
    code: "PROD-FEED",
    name: "Аналитика конверсии корма (IOFC)",
    description: "Управленческий отчет по эффективности кормления по группам",
    reportType: "PRODUCTION",
    authority: "INTERNAL",
    version: "1.0",
    defaultFormat: "XLSX",
  },
  {
    code: "MGMT-HERD",
    name: "Движение поголовья (СП-51)",
    description: "Ежемесячный отчет о движении скота на ферме",
    reportType: "MANAGEMENT",
    authority: "INTERNAL",
    version: "1.0",
    defaultFormat: "XLSX",
  }
];

async function main() {
  let createdCount = 0;
  for (const tpl of INITIAL_TEMPLATES) {
    const existing = await prisma.reportTemplate.findUnique({ where: { code: tpl.code } });
    if (!existing) {
      await prisma.reportTemplate.create({ data: tpl });
      createdCount++;
      console.log(`Created template ${tpl.code}`);
    } else {
      console.log(`Template ${tpl.code} already exists`);
    }
  }
  console.log(`Seeded ${createdCount} new templates successfully.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
