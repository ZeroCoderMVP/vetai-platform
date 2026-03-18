import prisma from "../src/lib/prisma";

// ============================================================================
// Скрипт генерации Synthetic / Approximated данных для демо Stage 1
// Данные генерируются на основе реальных коров из базы (AFI импорт).
// Генерируется слой истории на 30 дней для:
// - GroupMembership, CowSectionHistory, GroupSectionHistory
// - EconomicFact (баланс молока)
// - FeedRecord, MixBatch, IngredientConsumption (для графиков DTM)
// - MilkRecord (детализация для AIC)
// - Event (дополнительные алерты)
// Данный скрипт не удаляет старые данные, а дополняет их за последние 30 дней.
// ============================================================================

const DAYS_TO_SEED = 30;

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 1) {
    const val = Math.random() * (max - min) + min;
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
}

async function ensureBaseEntities() {
    let farm = await prisma.farm.findFirst();
    if (!farm) {
        farm = await prisma.farm.create({ data: { name: "Demo Farm" } });
    }

    let barns = await prisma.barn.findMany();
    if (barns.length === 0) {
        const b = await prisma.barn.create({ data: { name: "Barn 1", farmId: farm.id } });
        barns.push(b);
    }
    const barn = barns[0];

    const groupNames = ["Дойные 1", "Дойные 2", "Сухостой", "Транзит", "Новотельные"];
    let groups = await prisma.groupUnit.findMany();
    if (groups.length === 0) {
        for (const name of groupNames) {
            const g = await prisma.groupUnit.create({
                data: {
                    farmId: farm.id,
                    name,
                    type: name.includes("Дойные") || name === "Новотельные" ? "feeding_group" : "maternity",
                    headCount: 0
                }
            });
            groups.push(g);
        }
    }

    const sectionNames = ["Секция A", "Секция B", "Секция C", "Секция D", "Секция E"];
    let sections = await prisma.section.findMany();
    if (sections.length === 0) {
        for (const name of sectionNames) {
            const s = await prisma.section.create({
                data: { farmId: farm.id, barnId: barn.id, name }
            });
            sections.push(s);
        }
    }

    return { farm, barn, groups, sections };
}

async function main() {
    console.log("=========================================");
    console.log("Начинаем генерацию Demo Data Layer (Synthetic)");
    console.log("=========================================");

    const { farm, groups, sections } = await ensureBaseEntities();
    
    // Получаем реальных коров (AFI)
    let cows: any[] = await prisma.cow.findMany({ select: { id: true, number: true, status: true } });
    console.log(`Найдено коров в БД: ${cows.length}`);
    if (cows.length < 950) {
        console.log(`Догенерируем коров до 950 (не хватает ${950 - cows.length})...`);
        const needed = 950 - cows.length;
        const newCows = [];
        for (let i = 0; i < needed; i++) {
            const num = (Math.floor(Math.random() * 900000) + 100000).toString();
            newCows.push({
                farmId: farm.id,
                afiId: `synth_${num}_${i}`,
                number: num,
                status: Math.random() < 0.85 ? "active" : "dry",
                lactation: randomInt(1, 6),
                dim: randomInt(5, 305)
            });
        }
        await prisma.cow.createMany({ data: newCows });
        cows = await prisma.cow.findMany({ select: { id: true, number: true, status: true } });
        console.log(`Теперь коров в БД: ${cows.length}`);
    }

    const endDate = new Date();
    // Обнуляем время
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - DAYS_TO_SEED);
    startDate.setHours(0, 0, 0, 0);

    // 1. История (Membership & Sections) — Approximated
    console.log("Генерация: History (Membership / CowSectionHistory / GroupSectionHistory)...");
    let membershipCount = 0;
    let cowSectionCount = 0;
    
    // Распределяем коров по группам (стабильно на 30 дней)
    let cIndex = 0;
    for (let c of cows) {
        // Выбираем случайную группу и секцию для коровы по индексу
        const group = groups[cIndex % groups.length];
        const section = sections[cIndex % sections.length];
        cIndex++;

        // GroupMembership
        await prisma.groupMembership.create({
            data: {
                cowId: c.id,
                groupId: group.id,
                startDate: startDate,
                source: "synthetic_demo"
            }
        });
        membershipCount++;

        // CowSectionHistory
        await prisma.cowSectionHistory.create({
            data: {
                cowId: c.id,
                sectionId: section.id,
                startDate: startDate,
                source: "synthetic_demo"
            }
        });
        cowSectionCount++;

        // Обновим также currentGroupId / currentSectionId у коровы (cow -> group, section)
        await prisma.cow.update({
            where: { id: c.id },
            data: {
                groupId: group.id,
                currentSectionId: section.id
            }
        });
    }

    // GroupSectionHistory
    let groupSectionCount = 0;
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const section = sections[i % sections.length];
        await prisma.groupSectionHistory.create({
            data: {
                groupId: group.id,
                sectionId: section.id,
                startDate: startDate,
                source: "synthetic_demo"
            }
        });
        groupSectionCount++;
    }
    console.log(`Создано: Membership ${membershipCount}, CowSection ${cowSectionCount}, GroupSection ${groupSectionCount}`);

    // Получим валовый надой из AfimilkDayMilk
    // Для пропорционального распределения и расчета баланса
    const afiDays = await prisma.afimilkDayMilk.groupBy({
        by: ['date'],
        _sum: {
            actualTotal: true
        },
        where: {
            date: { gte: startDate, lte: endDate }
        }
    });

    const dayMilkMap = new Map<string, number>();
    for (const d of afiDays) {
        const dStr = d.date.toISOString().split("T")[0];
        dayMilkMap.set(dStr, d._sum.actualTotal || 0);
    }

    // 2. Баланс Молока и Экономика
    console.log("Генерация: Баланс Молока и Экономика (EconomicFact)...");
    let economicCount = 0;
    for (let d = 0; d <= DAYS_TO_SEED; d++) {
        const currentDate = new Date(startDate.getTime());
        currentDate.setDate(currentDate.getDate() + d);
        const dateStr = currentDate.toISOString().split("T")[0];

        // Если в AFI Day Milk нет валового за этот день, возьмем примерный надой 
        // 25 кг * кол-во дойных коров
        const milkingCowsCount = cows.filter(c => c.status === "active" || c.status === "Дойная").length;
        const fallbackYield = milkingCowsCount > 0 ? milkingCowsCount * 25 : 15000;
        
        let totalYield = dayMilkMap.get(dateStr) || fallbackYield;
        if (totalYield <= 0) totalYield = fallbackYield;

        const milkSold = totalYield * 0.92;
        const milkCalves = totalYield * 0.06;
        const milkLoss = totalYield * 0.02;

        const pricePerKg = randomFloat(34.5, 36.0, 2);
        const milkRevenue = milkSold * pricePerKg;
        // Издержки на корма
        const feedCostTotal = milkingCowsCount > 0 ? milkingCowsCount * randomFloat(250, 300, 2) : 280 * 500;

        const facts = [
            { type: "milk_sold", value: milkSold },
            { type: "milk_calves", value: milkCalves },
            { type: "milk_loss", value: milkLoss },
            { type: "milk_revenue", value: milkRevenue },
            { type: "feed_cost", value: feedCostTotal }
        ];

        for (const f of facts) {
            await prisma.economicFact.create({
                data: {
                    farmId: farm.id,
                    type: f.type,
                    value: f.value,
                    period: currentDate,
                    source: "synthetic_demo"
                }
            });
            economicCount++;
        }
    }
    console.log(`Создано: EconomicFact ${economicCount}`);

    // 3. Кормление (DTM 30-days fill)
    console.log("Генерация: Кормление (FeedRecord, MixBatch, IngredientConsumption)...");
    let feedCount = 0, mixCount = 0;
    const ingredients = [
        { name: "Силос кукурузный", price: 2.5 }, 
        { name: "Сенаж", price: 3.0 }, 
        { name: "Соевый шрот", price: 45.0 }
    ];

    for (const group of groups) {
        for (let d = 0; d <= DAYS_TO_SEED; d++) {
            const currentDate = new Date(startDate.getTime());
            currentDate.setDate(currentDate.getDate() + d);

            const isMilking = group.type === "feeding_group" || group.name.includes("Дойны");
            const headCount = 150 + randomInt(-10, 10);
            
            // Запись по группе
            const planned = headCount * (isMilking ? 48 : 22);
            const efficiency = randomFloat(0.94, 0.99, 3);
            const actual = planned * efficiency;
            const remainder = planned - actual;

            await prisma.feedRecord.create({
                data: {
                    groupId: group.id,
                    groupName: group.name,
                    date: currentDate,
                    planned: planned,
                    actual: actual,
                    remainder: remainder,
                    dryMatter: actual * 0.45,
                    headCount: headCount,
                    feedCostPerHead: isMilking ? randomFloat(280, 320) : randomFloat(120, 150),
                    iofc: isMilking ? randomFloat(100, 200) : 0,
                    groupType: isMilking ? "Дойные" : "Сухостой",
                    source: "synthetic_demo"
                }
            });
            feedCount++;

            // MixBatch (для истории замеса)
            const mb = await prisma.mixBatch.create({
                data: {
                    recipeName: `Рецепт ${group.name}`,
                    groupCode: group.name,
                    date: currentDate,
                    source: "synthetic_demo"
                }
            });
            mixCount++;

            // Ингредиенты замеса
            for (const ing of ingredients) {
                const ratio = ing.name === "Силос кукурузный" ? 0.6 : ing.name === "Сенаж" ? 0.3 : 0.1;
                const target = planned * ratio;
                const errFactor = randomFloat(-0.15, 0.15); // демо-ошибка до 15%
                const actWeight = target * (1 + errFactor);
                await prisma.ingredientConsumption.create({
                    data: {
                        mixBatchId: mb.id,
                        ingredientName: ing.name,
                        targetWeight: target,
                        indicatorWeight: target,
                        actualWeight: actWeight,
                        errorPercent: errFactor * 100,
                        date: currentDate
                    }
                });
            }

            // Добавим фейковый ковш/группу для генерации демо-статистики "По группам / ковшам"
            const kTarget = planned * 0.5;
            const kErr = randomFloat(-0.05, 0.05);
            await prisma.ingredientConsumption.create({
                data: {
                    mixBatchId: mb.id,
                    ingredientName: `Ковш группы ${group.name}`,
                    targetWeight: kTarget,
                    indicatorWeight: kTarget,
                    actualWeight: kTarget * (1 + kErr),
                    errorPercent: kErr * 100,
                    date: currentDate
                }
            });
        }
    }
    console.log(`Создано: FeedRecord ${feedCount}, MixBatch ${mixCount}, Ingredients ${mixCount * ingredients.length}`);

    // 4. Доения (AIC 30-days fill)
    console.log("Генерация: Доения (MilkRecord)...");
    let milkRecordCount = 0;
    const activeCows = cows.filter(c => c.status === "active" || c.status === "Дойная");
    
    for (let d = 0; d <= DAYS_TO_SEED; d++) {
        const currentDate = new Date(startDate.getTime());
        currentDate.setDate(currentDate.getDate() + d);

        for (const cow of activeCows) {
            let totalDayYield = 0;
            for (let s = 1; s <= 3; s++) { // 3 сессии
                try {
                    let yieldVal = randomFloat(8, 14, 1);
                    totalDayYield += yieldVal;
                    await prisma.milkRecord.create({
                        data: {
                            cowId: cow.id,
                            cowNumber: cow.number,
                            date: currentDate,
                            session: s,
                            yield: yieldVal,
                            conductivity: randomFloat(5.5, 6.8, 1),
                            scc: randomInt(100, 300),
                            source: "synthetic_demo"
                        }
                    });
                    milkRecordCount++;
                } catch (e: any) {
                    if (e.code !== 'P2002') throw e;
                }
            }
            try {
                await prisma.afimilkDayMilk.create({
                    data: {
                        farmId: farm.id,
                        cowId: cow.id,
                        cowNumber: cow.number,
                        date: currentDate,
                        avg10Total: totalDayYield * 0.95,
                        actualTotal: totalDayYield,
                        avg10Session1: totalDayYield * 0.4,
                        actualSession1: totalDayYield * 0.4,
                        avg10Session2: totalDayYield * 0.3,
                        actualSession2: totalDayYield * 0.3,
                        avg10Session3: totalDayYield * 0.3,
                        actualSession3: totalDayYield * 0.3,
                        sourceFile: "synthetic_demo"
                    }
                });
            } catch (e: any) {
                if (e.code !== 'P2002') throw e;
            }
        }
    }
    console.log(`Создано: MilkRecord & AfimilkDayMilk ${milkRecordCount}`);

    // 5. События (Events)
    console.log("Генерация: События (Event)...");
    let eventCount = 0;
    const eventTypes = ["Мастит подозрение", "Снижение удоя", "Надо осеменить", "Кетоз"];
    const updatedActiveCows = await prisma.cow.findMany({
        where: { status: { in: ["active", "Дойная", "active"] } }
    });

    for (const cow of updatedActiveCows) { // Генерируем события для всех активных коров
        // 3 события на корову (размазано по 30 дням)
        for (let i = 0; i < 3; i++) {
            const currentDate = new Date(startDate.getTime());
            currentDate.setDate(currentDate.getDate() + randomInt(0, DAYS_TO_SEED));

            // Примерно 20% событий — это critical
            const severity = Math.random() < 0.2 ? "critical" : "warning";
            const title = eventTypes[randomInt(0, eventTypes.length - 1)];

            // найдем группу коровы
            const group = groups.find(g => g.id === cow.groupId) || groups[0];
            const section = sections.find(s => s.id === cow.currentSectionId) || sections[0];

            await prisma.event.create({
                data: {
                    cowId: cow.id,
                    groupId: group.id,
                    sectionId: section.id,
                    farmId: farm.id,
                    title,
                    severity,
                    timestamp: currentDate,
                    source: "synthetic_demo"
                }
            });
            eventCount++;
        }
    }
    console.log(`Создано: Event ${eventCount}`);

    // 6. Задачи (OperationRequest) для Work Plans
    console.log("Генерация: Задачи План-Факт (OperationRequest)...");
    let opsCount = 0;
    const opTypes = ["INSEMINATION", "TREATMENT", "GROUP_TRANSFER", "HOOF_TRIM", "VACCINATION", "PREGNANCY_CHECK"];
    const opTitles = {
      "INSEMINATION": "Осеменение",
      "TREATMENT": "Лечение мастита",
      "GROUP_TRANSFER": "Перевод в сухостой",
      "HOOF_TRIM": "Обрезка копыт",
      "VACCINATION": "Плановая вакцинация",
      "PREGNANCY_CHECK": "УЗИ на стельность"
    };
    
    // Выберем 20 случайных коров для создания задач на ближайшие дни
    for (let i = 0; i < 30; i++) {
      const cow = activeCows[randomInt(0, activeCows.length - 1)];
      const opTypeStr = opTypes[randomInt(0, opTypes.length - 1)] as keyof typeof opTitles;
      const title = opTitles[opTypeStr];
      const priority = Math.random() < 0.2 ? "CRITICAL" : Math.random() < 0.5 ? "HIGH" : "MEDIUM";
      const statusOptions = ["CREATED", "PENDING_AFIMILK_ENTRY", "IN_PROGRESS", "ENTERED_IN_AFIMILK", "OVERDUE", "VERIFIED"];
      const status = statusOptions[randomInt(0, statusOptions.length - 1)];
      
      const opDate = new Date(startDate.getTime());
      opDate.setDate(opDate.getDate() + randomInt(DAYS_TO_SEED - 5, DAYS_TO_SEED + 5));
      const dueDate = new Date(opDate.getTime());
      dueDate.setHours(dueDate.getHours() + 24);

      await prisma.operationRequest.create({
        data: {
          farmId: farm.id,
          cowId: cow.id,
          operationType: opTypeStr,
          title: title,
          description: `Задача "${title}" по животному с номером ${cow.number}`,
          eventDate: opDate,
          dueDate: dueDate,
          priority: priority,
          status: status,
          createdById: "system_seeder",
          source: "AUTO_RULE"
        }
      });
      opsCount++;
    }
    console.log(`Создано: OperationRequest ${opsCount}`);

    console.log("=========================================");
    console.log("Генерация демо-данных Stage 1 успешно завершена!");
    console.log("=========================================");
}

main()
    .catch((e) => {
        console.error("Ошибка при генерации демо-данных:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
