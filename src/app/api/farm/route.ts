// API Route: Получение данных фермы
import { NextResponse } from "next/server";
import { loadAllFarmData } from "@/services/farmData";
import { getMockFarmData } from "@/lib/mockData";

// Установите VETAI_USE_REAL_DATA=1 чтобы использовать реальные парсеры
const USE_REAL = process.env.VETAI_USE_REAL_DATA === '1';

export async function GET() {
  // По умолчанию: отдаём mock-данные для стабильного UI
  if (!USE_REAL) {
    return NextResponse.json(getMockFarmData());
  }

  try {
    const data = loadAllFarmData();
    if (!data.totalAnimals || data.totalAnimals === 0) {
      return NextResponse.json(getMockFarmData());
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка загрузки данных фермы, отдаём mock:", error);
    return NextResponse.json(getMockFarmData());
  }
}
