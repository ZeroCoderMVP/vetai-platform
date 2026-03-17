# Модуль отчётности: текущее состояние vs целевая production-архитектура

## 1. Контекст и цель

Этот документ фиксирует разрыв между текущей реализацией модуля отчётности и целевым production-уровнем, а также определяет, что можно закрыть за **1–2 спринта**.

---

## 2. Текущее состояние (as-is)

### 2.1 Что уже хорошо сделано

- Есть полноценная доменная модель в Prisma:
  - шаблоны, секции, строки,
  - экземпляры отчётов,
  - валидационные issues,
  - задания экспорта,
  - отправки,
  - аудит.
- Есть базовые API-эндпоинты:
  - templates,
  - instances (list/create draft),
  - generate,
  - export,
  - seed.
- Есть UI-страницы:
  - витрина отчётов (`/reporting`),
  - карточка отчёта (`/reporting/reports/[id]`),
  - реестр шаблонов (`/reporting/templates`).
- Есть сервисный слой (generator/validation/export/submission/audit), который уже отражает жизненный цикл отчёта.

### 2.2 Основные ограничения

- Генерация отчётов частично mock (часть данных зашита в коде).
- Экспорт сейчас mock (формируется URL без реального файла).
- Детальная страница отчёта в UI работает на mock-данных (`setTimeout`), а не на live-GET инстанса.
- В API нет endpoint для получения одного инстанса отчёта и явного endpoint для submit/approve workflow.
- Отсутствует формализованный state machine (правила допустимых переходов статусов).
- Нет очередей/воркеров для тяжёлых операций (generate/export/submit).
- Нет идемпотентности, retry-политик, распределённой трассировки и операционных SLO/алертов.
- Нет явной multi-tenant изоляции и RBAC/ABAC для ролей (оператор, зоотехник, ветврач, администратор).
- Нет версионируемой схемы payload по шаблонам и миграций между версиями форм.

---

## 3. Целевая production-архитектура (to-be)

## 3.1 Архитектурные слои

1. **UI/BFF (Next.js)**
   - Только orchestration и UX.
   - Без mock-данных.
   - Polling/SSE для статусов фоновых задач.

2. **Reporting API (Domain layer)**
   - CRUD шаблонов/инстансов.
   - Строгая state machine отчётов.
   - Валидация входных DTO (zod/valibot).

3. **Workers/Jobs**
   - Генерация отчётов.
   - Экспорт (XLSX/PDF/CSV/XML/JSON).
   - Отправка во внешние системы.
   - Retry/backoff/dead-letter queue.

4. **Storage**
   - PostgreSQL для транзакционных данных.
   - Object Storage (S3-совместимый) для файлов отчётов и артефактов.

5. **Observability & Security**
   - Структурированные логи + traceId/correlationId.
   - Метрики (latency, error rate, queue depth).
   - RBAC/ABAC + аудит всех критичных действий.

## 3.2 Жизненный цикл (state machine)

Рекомендуемые статусы:

`DRAFT -> GENERATING -> GENERATED -> VALIDATING -> READY_FOR_REVIEW -> APPROVED -> EXPORTING -> EXPORTED -> SUBMITTING -> SUBMITTED -> ACCEPTED | REJECTED`

Дополнительно:

- `FAILED_GENERATION`
- `FAILED_EXPORT`
- `FAILED_SUBMISSION`
- `REVISED` (новая версия после отклонения)

Правила:

- Переходы только через доменный сервис.
- Каждое изменение статуса — audit event.
- Оптимистичная блокировка (versionNumber + check).

## 3.3 Контракт данных отчёта

- Для каждого шаблона: versioned schema (`schemaJson`) и contract-тесты.
- `payloadJson` хранить валидированным против версии шаблона.
- При изменении шаблона — стратегия миграций payload (v1 -> v2).

## 3.4 Экспорт и отправка

- Экспорт в фоне, с хранением артефактов в Object Storage.
- Pre-signed URL для скачивания.
- Submission adapters по каналам:
  - MANUAL,
  - FILE_EXPORT,
  - API.
- Для API-каналов: идемпотентный ключ + журнал запрос/ответ + retry.

---

## 4. Gap-анализ: as-is vs to-be

| Область | As-is | To-be | Приоритет |
|---|---|---|---|
| Генерация | Частично mock | Полностью data-driven builders | P0 |
| Экспорт | Mock URL | Реальные файлы + storage + signed URL | P0 |
| UI детали отчёта | Mock объект | Live data + статусы задач | P0 |
| API контракты | Базовые endpoint-ы | Полный lifecycle API + DTO validation | P0 |
| State machine | Неформализовано | Явные переходы и guard rules | P0 |
| Очереди | Нет | Worker + queue + retries + DLQ | P1 |
| Безопасность | Базовая | RBAC/ABAC + farm scoping + audit completeness | P1 |
| Наблюдаемость | Локальные логи | Structured logs + traces + metrics + alerts | P1 |
| Версионирование шаблонов | Частично | Контракт, миграции, совместимость | P1 |
| Тестирование | Точечное | Unit + integration + contract + e2e critical path | P1 |

---

## 5. План на 1–2 спринта

## Sprint 1 (P0): «Убрать mock и стабилизировать жизненный цикл»

### Цели

- Перейти на live-данные в UI и API.
- Зафиксировать state machine.
- Включить рабочую генерацию/валидацию на реальных данных (минимально необходимый scope).

### Бэклог

1. **API: инстансы**
   - `GET /api/reporting/instances/[id]` (детализация).
   - `POST /api/reporting/instances/[id]/approve`.
   - `POST /api/reporting/instances/[id]/submit`.

2. **Domain/state machine**
   - Сервис переходов статусов + guard rules.
   - Запрет недопустимых переходов (409).

3. **UI /reporting/reports/[id]**
   - Убрать mock `setTimeout`.
   - Загружать реальный инстанс.
   - Отображать validation/export/submission timeline из audit.

4. **Generator MVP**
   - Для 1–2 ключевых форм реализовать data-driven построение.
   - Валидация обязательных полей + severity.

5. **Observability baseline**
   - Единый лог-формат + traceId.
   - Базовые метрики API (success/error/latency).

### Definition of Done

- Критический путь работает без mock:
  - создать draft,
  - сгенерировать,
  - увидеть warnings/errors,
  - approve,
  - submit.
- Все переходы статусов проверяются и аудируются.

---

## Sprint 2 (P1): «Надёжный экспорт и эксплуатационная готовность»

### Цели

- Перенести тяжёлые операции в фоновые задачи.
- Сделать production-ready экспорт и отправку.
- Усилить безопасность и тестовое покрытие.

### Бэклог

1. **Jobs/Queue**
   - Вынести generate/export/submit в worker.
   - Retry policy + DLQ.

2. **Экспорт production**
   - Генерация реальных XLSX/PDF/CSV/XML.
   - Хранение в object storage.
   - Signed URL + TTL.

3. **Submission adapters**
   - Единый интерфейс адаптеров каналов.
   - Идемпотентность, re-submit policy, журнал внешних ответов.

4. **Security**
   - RBAC роли + farm-level scoping во всех запросах.
   - Аудит actorId/actorName для каждого mutation.

5. **Тесты**
   - Unit тесты доменных сервисов.
   - Интеграционные тесты API + Prisma.
   - Contract tests для шаблонов отчётов.

### Definition of Done

- Генерация/экспорт/отправка выполняются асинхронно и наблюдаемы.
- Экспортируемые файлы скачиваются из storage по signed URL.
- Ошибки внешних API восстанавливаются retry-механизмом.

---

## 6. KPI готовности модуля

- **Functional**
  - ≥ 95% отчётов ключевых форм формируются без ручной правки payload.
- **Reliability**
  - error rate по generate/export/submit < 2%.
  - retry success rate > 80% для транзиентных ошибок.
- **Performance**
  - p95 generate < 15s (для типового объёма фермы).
  - p95 export < 20s.
- **Quality**
  - Покрытие unit+integration по reporting domain ≥ 70%.
- **Operations**
  - Наличие дашборда с queue depth, failed jobs, p95 latency.

---

## 7. Риски и меры снижения

- **Риск:** разношёрстные форматы внешних регуляторов.
  - **Мера:** contract-driven adapters + feature flags по каналам.
- **Риск:** тяжёлый экспорт блокирует API.
  - **Мера:** только async jobs + лимиты параллельности.
- **Риск:** невалидные данные источников.
  - **Мера:** многоуровневая валидация + прозрачная модель warning/error.
- **Риск:** регрессии при изменении шаблонов.
  - **Мера:** versioned schemas + миграции payload + regression test pack.

---

## 8. Быстрый чек-лист внедрения

- [ ] Добавлены lifecycle endpoints (`approve`, `submit`, `instance by id`)
- [ ] Введён state machine service
- [ ] Убран mock из `/reporting/reports/[id]`
- [ ] Экспорт формирует реальный файл
- [ ] Фоновые worker jobs с retry/DLQ
- [ ] RBAC + farm scoping на mutation/read
- [ ] Метрики и алерты подключены
- [ ] Тесты критического пути проходят в CI