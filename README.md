# VETAI Platform (Stage 1, SQLite-first)

Ветка Stage 1 работает в режиме **SQLite-first**:
- runtime API/UI читают данные из SQLite;
- файловые источники используются как вход для импорта;
- mock не включается по умолчанию.

## Запуск локально

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Приложение: `http://localhost:3000`.

## Режим mock (только явный debug fallback)

По умолчанию mock **выключен**.

Включить mock fallback:

```bash
VETAI_ALLOW_MOCK=1 npm run dev
```

При пустой SQLite в основных API возвращается `status: "no_data"`, а UI показывает состояние «данные не загружены».

## Папки ingestion

По умолчанию import-service использует `/data`:

```text
/data
  /inbox
    /afimilk
    /dtm
    /aic
  /processed
    /afimilk
    /dtm
    /aic
  /error
    /afimilk
    /dtm
    /aic
```

Можно переопределить корневую папку через `VETAI_DATA_ROOT`.

## Импорт данных

Положите файлы в `inbox/<source>`, затем запустите импорт:

```bash
curl -X POST http://localhost:3000/api/import
```

Проверить статус интеграций:

```bash
curl http://localhost:3000/api/import
```
