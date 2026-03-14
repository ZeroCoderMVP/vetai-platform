import path from "path";

function resolveProjectPath(configuredPath: string | undefined, fallback: string) {
  if (!configuredPath || configuredPath.trim() === "") {
    return path.resolve(process.cwd(), fallback);
  }

  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

export function getSqliteDbPath() {
  return resolveProjectPath(process.env.VETAI_DB_PATH, "dev.db");
}

export function getPrismaSqliteUrl() {
  const dbPath = getSqliteDbPath();
  const relativePath = path.relative(process.cwd(), dbPath).replace(/\\/g, "/");
  const normalized = relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  return `file:${normalized}`;
}

export function getDataRoot() {
  return resolveProjectPath(process.env.VETAI_DATA_ROOT, "data");
}
