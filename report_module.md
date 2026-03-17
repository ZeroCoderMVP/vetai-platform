Ниже — детальный разбор того, что сейчас есть в модуле отчётности в этом репозитории.

1) Где модуль находится и как включён в приложение
Модуль доступен как отдельный раздел в боковом меню по маршруту /reporting (раздел «Система» → «Отчетность»).

В БД выделен отдельный блок «Фаза 4 — Модуль Отчетности V2 (Reporting)» с полноценной доменной моделью (шаблоны, инстансы, валидация, экспорт, отправка, аудит).

2) Доменная модель (Prisma): что хранится
В prisma/schema.prisma реализованы сущности:

ReportTemplate — шаблон отчёта: код/версия, тип отчёта, орган, формат по умолчанию, JSON-конфиг/схема, связь с фермой, секциями и инстансами.

ReportSection — секции шаблона с порядком сортировки и конфигом.

ReportLine — строки/метрики внутри секции (тип значения, формула, sourceEntity/sourceField, обязательность).

ReportInstance — экземпляр отчёта (период, дата отчёта, статус, payload/summary JSON, файл, timestamps, связи с валидацией/экспортом/сабмитом/аудитом).

ReportValidationIssue — замечания/ошибки проверки качества данных.

ReportExportJob — задания экспорта файла (статус, URL, ошибка, completedAt).

ReportSubmission — отправка отчёта во внешние каналы/системы.

ReportAuditLog — аудит действий по экземпляру отчёта.

3) Backend-сервисы отчётности (слой бизнес-логики)
В src/lib/services/reporting сейчас есть 7 сервисов:

ReportTemplateService

получение всех активных шаблонов;

получение шаблона по коду с секциями и строками.

ReportInstanceService

список инстансов (с join на шаблон/ферму);

получение одного инстанса с деталями (template->sections->lines, validationIssues, exports, submissions, auditLogs);

создание draft-инстанса из шаблона.

ReportGeneratorService

главный orchestration-метод generateReport;

роутинг генерации по template.code/reportType;

5 builder-веток (BREEDING/REGULATORY/VETERINARY/PRODUCTION/MANAGEMENT) сейчас в основном mock/демо;

запись payloadJson, summaryJson, статуса, времени генерации;

вызов валидации и запись в аудит;

при ошибке — перевод в VALIDATION_ERROR и аудит generation_failed.

ReportValidationService

транзакционно очищает старые issues и пишет новые;

возвращает флаг, есть ли ERROR/CRITICAL.

ReportExportService

создаёт export-job, делает mock-генерацию URL файла, помечает job completed, пишет fileUrl в инстанс.

ReportSubmissionService

создаёт submission (SENT), переводит инстанс в SUBMITTED, пишет аудит submitted.

ReportAuditService

добавление записи аудита с сериализацией before/after JSON;

получение истории аудита по инстансу.

4) API-слой (что уже поднято)
Доступные endpoint’ы:

GET /api/reporting/templates — отдаёт активные шаблоны.

GET /api/reporting/instances — список инстансов;
POST /api/reporting/instances — создание черновика по обязательным полям (templateId, farmId, periodStart, periodEnd, title, format).

POST /api/reporting/reports/[id]/generate — запуск генерации конкретного отчёта.

POST /api/reporting/reports/[id]/export — запуск экспорта по формату из body.

GET /api/reporting/seed — сидирование 5 базовых шаблонов (REG-PLEM, REG-MILK, VET-EPI, PROD-FEED, MGMT-HERD).

5) Frontend-часть модуля
/reporting (каталог отчётов)
Загружает шаблоны с /api/reporting/templates.

Есть вкладки фильтрации по типам: all / REGULATORY / BREEDING / VETERINARY / PRODUCTION / MANAGEMENT / archive.

Карточки шаблонов, переход по клику в /reporting/reports/[template.id].

Есть кнопка «Создать новый» в карточке (как UI-элемент).

/reporting/reports/[id] (детали отчёта)
Сейчас в основном mock-экран: данные отчёта заполняются через setTimeout.

Кнопки:

«Сгенерировать / Проверить» → POST generate endpoint;

«Экспорт» → POST export endpoint;

«Утвердить» пока только alert.

Отображаются статус, период, summary-метрики, блок validation issues и заглушка предпросмотра таблицы.

/reporting/templates (реестр шаблонов)
Табличный список шаблонов из API;

Кнопка «Создать шаблон» пока без обработчика бизнес-логики.

6) Что уже реализовано, а что пока «черновое»
Реализовано:

Достаточно полная структура БД под жизненный цикл отчёта.

Сервисы генерации/валидации/экспорта/сабмита/аудита.

Базовые API-эндпоинты и UI-страницы модуля.

Сидирование 5 ключевых шаблонов.

Пока черновое / mock:

Генераторы отчётов в ReportGeneratorService частично на демо-данных (например фиксированные метрики/события).

Экспорт формирует mock fileUrl без реального построения файла.

Детальная страница отчёта на фронте заполняется mock-объектом, не реальным GET инстанса.

Подтверждение/утверждение в UI пока без полноценного backend workflow.

Команды, которые я использовал для анализа
pwd && rg --files -g 'AGENTS.md'

find . -maxdepth 3 -type d | head -n 200

rg --files | head -n 200

sed -n '1,220p' prisma/schema.prisma

rg -n "model Report|report" prisma/schema.prisma | head -n 50

sed -n '380,590p' prisma/schema.prisma

nl -ba src/lib/services/reporting/report-template.service.ts | sed -n '1,240p'

nl -ba src/lib/services/reporting/report-generator.service.ts | sed -n '1,300p'

nl -ba src/lib/services/reporting/report-validation.service.ts | sed -n '1,260p'

nl -ba src/lib/services/reporting/report-instance.service.ts | sed -n '1,280p'

nl -ba src/lib/services/reporting/report-export.service.ts | sed -n '1,320p'

nl -ba src/lib/services/reporting/report-submission.service.ts | sed -n '1,320p'

nl -ba src/lib/services/reporting/report-audit.service.ts | sed -n '1,260p'

nl -ba src/app/api/reporting/templates/route.ts | sed -n '1,240p'

nl -ba src/app/api/reporting/instances/route.ts | sed -n '1,280p'

nl -ba src/app/api/reporting/reports/[id]/generate/route.ts | sed -n '1,260p'

nl -ba src/app/api/reporting/reports/[id]/export/route.ts | sed -n '1,260p'

nl -ba src/app/api/reporting/seed/route.ts | sed -n '1,320p'

nl -ba src/app/reporting/page.tsx | sed -n '1,340p'

nl -ba src/app/reporting/reports/[id]/page.tsx | sed -n '1,380p'

nl -ba src/app/reporting/templates/page.tsx | sed -n '1,260p'

nl -ba src/components/layout/Sidebar.tsx | sed -n '1,260p'

git status --short