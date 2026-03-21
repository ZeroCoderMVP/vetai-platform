Контекст

Ты работаешь внутри существующего проекта платформы ВЕТАИ.
Не переписывай проект с нуля.
Не создавай отдельное приложение.
Не ломай текущую архитектуру, существующие маршруты, shared components и стиль интерфейса.
Нужно развить уже существующий или проектируемый модуль “Сценарии” и добавить в него полноценный блок “Настройки модели”.

Задача

Нужно реализовать в модуле “Сценарии” настраиваемую rule-based модель расчета сценариев кормления и отклика по молоку.

Сейчас нельзя делать фиксированные жестко зашитые формулы без возможности настройки.
Нужно сделать так, чтобы пользователь через UI мог управлять параметрами модели:
- как ингредиенты влияют на молоко;
- где начинается насыщение;
- где потолок прироста;
- как выданный корм переходит в съеденное и остатки;
- где начинаются потери, перекорм и экономическая неэффективность;
- как применяются лаги и штрафы риска.

Это должна быть не ML-модель и не внешний сервис.
Это должна быть прозрачная, объяснимая, детерминированная параметрическая система правил.

Ключевая идея

На вкладке “Сценарии” должна появиться кнопка-шестерёнка “Настройки модели”.
По нажатию открывается подробный интерфейс настройки параметров сценарного движка.
Изменения в этих настройках должны влиять на результаты сценарного расчета.

Что нужно сделать

1. Добавить в UI вкладки “Сценарии” кнопку “Настройки модели”.
2. Реализовать отдельное окно/панель настройки модели.
3. Реализовать хранение профилей правил и их версий.
4. Реализовать набор rule-based конфигов:
   - кривые отклика молока от ингредиентов;
   - кривые перехода “выдано -> съедено -> остатки”;
   - коэффициенты по группам/стадиям лактации;
   - риски и штрафы;
   - лаги и инерция;
   - экономические коэффициенты.
5. Подключить эти правила к существующему scenario engine.
6. Обеспечить, чтобы результаты сценария менялись при изменении параметров модели.
7. Показать пользователю не только итоговые KPI, но и объяснимые диагностические показатели:
   - насыщение;
   - остатки;
   - маржинальная отдача;
   - риск;
   - вклад ингредиентов.

Что не делать

- не использовать ML;
- не использовать LLM внутри модуля;
- не выносить логику в сторонние сервисы;
- не зашивать коэффициенты только в код без возможности редактирования;
- не делать интерфейс визуально чужеродным;
- не ломать существующую страницу сценариев;
- не заменять текущий сценарный модуль новым с нуля;
- не тащить PostgreSQL или отдельный backend, если локального/mock persistence достаточно;
- не делать магические “умные” автокоррекции без явного отображения в UI.

Требования к архитектуре

Используй существующие компоненты, паттерны, стили и shared UI, если они уже есть в проекте.

Создай или адаптируй примерно такие сущности и файлы:

- components/scenarios/ScenarioModelSettingsButton.tsx
- components/scenarios/ScenarioModelSettingsPanel.tsx
- components/scenarios/settings/GeneralSettingsTab.tsx
- components/scenarios/settings/IngredientCurvesTab.tsx
- components/scenarios/settings/FeedUtilizationTab.tsx
- components/scenarios/settings/GroupProfilesTab.tsx
- components/scenarios/settings/RiskRulesTab.tsx
- components/scenarios/settings/LagsTab.tsx
- components/scenarios/settings/EconomicsTab.tsx
- components/scenarios/settings/CurveEditor.tsx
- components/scenarios/settings/RuleProfileSelector.tsx

- lib/scenarios/model/scenarioModelEngine.ts
- lib/scenarios/model/scenarioModelDefaults.ts
- lib/scenarios/model/scenarioModelStorage.ts
- lib/scenarios/model/scenarioModelValidators.ts
- lib/scenarios/model/scenarioModelMappers.ts

- types/scenarioModel.ts

Если структура проекта другая, встрои всё в текущую организацию, но сохрани модульность и читаемость.

Типы и сущности

Нужно ввести типизированные модели.

1. ScenarioModelProfile
Минимальные поля:
- id
- name
- description
- scopeType: farm | groupType | group | global
- scopeId: string | null
- isActive
- isDefault
- version
- createdAt
- updatedAt
- createdBy
- config

2. ScenarioModelConfig
Внутри:
- general
- ingredientResponseRules
- feedUtilizationRules
- groupProfileRules
- riskPenaltyRules
- lagRules
- economicsRules

3. IngredientResponseRule
Минимальные поля:
- ingredientCode
- ingredientName
- enabled
- ingredientType: energy | protein | fiber | mineral | buffer | fat | additive | other
- xUnit: kgHeadDay | dryMatterKg | rationPercent
- yUnit: milkKgHeadDay | milkPercent
- baselineX
- minAllowed
- recommendedMin
- saturationStart
- saturationEnd
- maxMilkDelta
- slopeStart
- diminishingReturnFactor
- deficiencyPenaltyFactor
- excessPenaltyFactor
- lagDays
- rampUpDays
- decayDays
- points[] (для режима ручной кривой)
- mode: parametric | points

4. FeedUtilizationRule
Минимальные поля:
- profileId
- baselineNeed
- physiologicalIntakeLimit
- intakeSlowdownPoint
- intakePlateauPoint
- targetRefusalMin
- targetRefusalMax
- extraFeedToIntakeFactor
- extraFeedToRefusalFactor
- wasteGrowthFactor
- efficiencyDropFactor

5. GroupProfileRule
Минимальные поля:
- groupType: fresh | high | mid | late | dry | transition | custom
- milkSensitivityEnergy
- milkSensitivityProtein
- milkSensitivityFiber
- intakeCeilingFactor
- refusalTolerance
- stockingDensitySensitivity
- regimeDisruptionSensitivity
- lagSensitivity

6. RiskPenaltyRule
Минимальные поля:
- code
- name
- enabled
- thresholdYellow
- thresholdRed
- milkPenaltyFactor
- iofcPenaltyFactor
- riskScorePenalty
- warningText

7. LagRule
Минимальные поля:
- milkLagDays
- refusalLagDays
- economicsLagDays
- transitionSpeed
- rollbackSpeed
- smoothingFactor
- cumulativeEffectEnabled

8. EconomicsRule
Минимальные поля:
- milkPrice
- feedWasteCostFactor
- overfeedingPenaltyCost
- feedCostPerKgDM
- marginalIofcFactor
- costPerLiterAdjustment

UI: общая логика

На странице “Сценарии” в правом верхнем углу должна появиться кнопка:
- иконка шестерёнки
- текст: “Настройки модели”

По нажатию открывается:
- либо large modal;
- либо right-side drawer большого формата;
- ширина 1100–1280 px для desktop;
- внутри слева вертикальный список вкладок;
- справа содержимое текущей вкладки.

Верхняя часть окна настроек модели

Должны быть:
- название профиля правил;
- краткое описание;
- версия;
- статус: Черновик / Активен / Архив;
- scope selector:
  - вся ферма;
  - тип группы;
  - конкретная группа;
- кнопки:
  - Сохранить
  - Сохранить как новую версию
  - Сбросить
  - Применить к сценарию

Вкладки окна “Настройки модели”

1. Общие параметры
Поля:
- горизонт расчёта по умолчанию;
- единица расчёта;
- коэффициент консервативности;
- коэффициент доверия к модели;
- общий риск-множитель;
- флаг “разрешать агрессивные сценарии”;
- флаг “предупреждать о биологически сомнительных сценариях”.

2. Кривые отклика молока от ингредиентов
Для каждого ингредиента должна быть отдельная карточка.
Нужно показать:
- название;
- тип ингредиента;
- enabled switch;
- кнопка настройки;
- мини-preview кривой.

При открытии настройки ингредиента:
- показать большой график;
- ось X = изменение ингредиента;
- ось Y = изменение молока;
- подсветить зоны:
  - дефицит;
  - рабочая зона;
  - насыщение;
  - избыток/риск.

Поддержать два режима:
- parametric;
- manual points.

В manual points пользователь двигает опорные точки кривой.
В parametric пользователь задаёт поля:
- baselineX
- minAllowed
- recommendedMin
- saturationStart
- saturationEnd
- maxMilkDelta
- slopeStart
- diminishingReturnFactor
- deficiencyPenaltyFactor
- excessPenaltyFactor
- lagDays
- rampUpDays
- decayDays

Нужно поддержать как минимум:
- кукурузный силос
- сенаж
- сено
- солома
- комбикорм
- зерно
- жмых/шрот
- белковая добавка
- премикс
- буфер
- жиры/энергодобавки
- custom ingredient из справочника

3. Переход “выдано -> съедено -> остатки”
Нужен отдельный график с несколькими линиями:
- съедено;
- остатки;
- коэффициент использования.

Ось X:
- % от потребности
или
- дополнительная выдача кг/гол/день

Ось Y:
- доля или объём распределения

Параметры:
- baselineNeed
- physiologicalIntakeLimit
- intakeSlowdownPoint
- intakePlateauPoint
- targetRefusalMin
- targetRefusalMax
- extraFeedToIntakeFactor
- extraFeedToRefusalFactor
- wasteGrowthFactor
- efficiencyDropFactor

Логика графика:
- сначала дополнительная выдача частично превращается в съеденное;
- затем рост съеденного замедляется;
- после точки насыщения основная часть прибавки должна уходить в остатки;
- интерфейс должен визуально показывать точку перегиба.

4. Группы и стадии лактации
Нужны профили по группам:
- fresh
- high
- mid
- late
- dry
- transition
- custom

Для каждой группы отдельная карточка с коэффициентами:
- milkSensitivityEnergy
- milkSensitivityProtein
- milkSensitivityFiber
- intakeCeilingFactor
- refusalTolerance
- stockingDensitySensitivity
- regimeDisruptionSensitivity
- lagSensitivity

5. Риски и штрафы
Нужен список правил риска.
Как минимум:
- слишком низкие остатки;
- слишком высокие остатки;
- слишком резкое изменение рациона;
- перегрузка концентратами;
- рост стоимости без эквивалентной отдачи;
- плохая точность кормления;
- выход за рекомендуемые границы dry matter;
- высокая плотность.

Для каждого:
- enabled;
- yellow threshold;
- red threshold;
- milk penalty;
- IOFC penalty;
- risk score penalty;
- текст предупреждения.

6. Лаги и инерция
Поля:
- milkLagDays
- refusalLagDays
- economicsLagDays
- transitionSpeed
- rollbackSpeed
- smoothingFactor
- cumulativeEffectEnabled

7. Экономика
Поля:
- milkPrice
- feedCostPerKgDM
- feedWasteCostFactor
- overfeedingPenaltyCost
- marginalIofcFactor
- costPerLiterAdjustment

Интеграция с scenario engine

Существующий или создаваемый scenario engine должен теперь использовать активный профиль модели.

На входе:
- baseline state;
- scenario parameters;
- selected horizon;
- selected model profile.

На выходе:
- updated KPI;
- chart data;
- comparison to baseline;
- diagnostics;
- insights;
- risks.

Нужно явно учитывать:
1. изменение ингредиентов;
2. насыщение;
3. убывающую отдачу;
4. рост остатков при избытке;
5. лаг эффекта;
6. риск-пенальти;
7. экономические последствия.

Математика должна быть rule-based и deterministic.
Не нужна сложная биология, но нельзя делать абсурд:
- бесконечный рост молока от бесконечного корма запрещён;
- при сильном избытке корм должен уходить в остатки;
- marginal return должен снижаться;
- reproduction/health/genetics здесь не расширять сверх необходимого, но архитектурно не мешать им.

Что должно быть видно пользователю после применения профиля

В сценарии должны обновляться не только стандартные KPI, но и специальные диагностические блоки:

1. Diagnostic KPI cards
- Доп. корм -> в молоко
- Доп. корм -> в остатки
- Потолок отклика
- Маржинальная отдача
- Риск перекорма
- Экономический эффект

2. Графики
- baseline vs scenario по молоку;
- baseline vs scenario по IOFC;
- baseline vs scenario по остаткам;
- curve position indicator: где текущий сценарий находится на кривой насыщения.

3. Таблица факторов влияния
Колонки:
- фактор
- изменение
- ожидаемый эффект
- риск
- комментарий

4. Insight block
Нужно формировать rule-based insights:
- что улучшилось;
- что ухудшилось;
- где достигнут почти потолок;
- где дополнительный корм уходит в остатки;
- где основная экономическая потеря;
- что главный риск сценария.

Примеры текстов:
- “Дополнительный комбикорм даёт слабую маржинальную отдачу: рост затрат выше прироста молока.”
- “Сценарий близок к потолку отклика по кукурузному силосу.”
- “Дополнительная выдача корма переходит преимущественно в остатки.”
- “Главный риск сценария — рост себестоимости без эквивалентного прироста молока.”

Хранение

Если нет серверного persistence:
- используй localStorage или существующий mock repository pattern.

Нужно поддержать:
- создание профиля;
- редактирование профиля;
- версионирование;
- выбор активного профиля;
- откат к default;
- применение профиля к сценарию.

Также нужен дефолтный профиль по умолчанию.
Если пользователь ничего не настраивал, сценарии должны работать на дефолтных коэффициентах.

Важно:
показывай в UI заметку:
“Используются типовые коэффициенты, не откалиброванные на истории хозяйства”
если применён дефолтный профиль без пользовательской настройки.

Требования к коду

- TypeScript strict-friendly
- никакого any без острой необходимости
- понятные типы и интерфейсы
- модульные helper functions
- без дублирования логики
- расчёты и UI должны быть разделены
- валидация входных параметров обязательна
- конфиги вынести из UI-компонентов
- не ломать существующие страницы и существующий сценарный модуль

Что проверить перед завершением

1. Кнопка “Настройки модели” появилась на странице сценариев.
2. Окно настроек открывается.
3. Можно выбрать или создать профиль.
4. Можно менять параметры по ингредиенту.
5. Можно менять параметры перехода “выдано -> съедено -> остатки”.
6. Можно сохранять профиль.
7. Можно сохранять новую версию профиля.
8. При смене профиля сценарий реально пересчитывается.
9. KPI и графики меняются.
10. Показываются диагностические карточки и risk indicators.
11. Всё работает без обязательной БД.
12. При отсутствии persistence есть mock/local fallback.
13. UI выглядит как часть ВЕТАИ, а не как чужой прототип.

Критерии приемки

Считать задачу выполненной, если:
- в модуле “Сценарии” есть кнопка “Настройки модели”;
- открывается подробный интерфейс настройки модели;
- можно редактировать кривые отклика по ингредиентам;
- можно редактировать кривые перехода корма в съеденное/остатки;
- можно задавать риски, лаги и экономические коэффициенты;
- профиль правил сохраняется и может версионироваться;
- активный профиль влияет на сценарные KPI и графики;
- сценарий показывает объяснимые diagnostics и insights;
- код пригоден для дальнейшего расширения;
- решение не ломает существующий проект.

Порядок работы

1. Сначала изучи текущую структуру проекта.
2. Найди существующую страницу сценариев и все shared components.
3. Найди текущий scenario engine или его каркас.
4. Спроектируй types и config layer.
5. Реализуй storage/profile versioning.
6. Реализуй settings UI.
7. Подключи settings к scenario engine.
8. Добавь diagnostics и insights.
9. Убедись, что всё работает без БД.
10. Проверь happy path руками.
11. После завершения покажи:
   - какие файлы созданы;
   - какие изменены;
   - как устроена логика rules;
   - что работает уже сейчас;
   - что оставлено как каркас на следующую итерацию.

Формат ответа после выполнения

1. список созданных файлов;
2. список изменённых файлов;
3. краткое описание архитектуры;
4. краткое описание rule engine;
5. что работает;
6. что не реализовано полностью и оставлено на следующий этап;
7. какие ручные проверки нужно сделать.