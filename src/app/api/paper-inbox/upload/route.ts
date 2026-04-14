import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // В реальности тут мы отправляли бы файл (FormData) в Python/ML-сервис OCR
    // const formData = await request.formData();
    // const file = formData.get("file");

    // Имитируем задержку на распознавание (2 секунды)
    await new Promise((resume) => setTimeout(resume, 2000));

    // Возвращаем мок-результат "распознанного" листа смены
    const mockExtractedData = [
      {
        id: crypto.randomUUID(),
        cowNumber: "345A",
        eventType: "Осеменение",
        date: new Date().toISOString(),
        notes: "Бык: Сильвер. Техник: Иванов",
        confidenceScore: 95,
      },
      {
        id: crypto.randomUUID(),
        cowNumber: "988B",
        eventType: "Измерение температуры",
        date: new Date().toISOString(),
        notes: "T=39.5, подозрение на мастит",
        confidenceScore: 78,
      },
      {
        id: crypto.randomUUID(),
        cowNumber: "???_2", // Ошибка OCR
        eventType: "Отёл",
        date: new Date().toISOString(),
        notes: "Живой телёнок, бычок",
        confidenceScore: 40,
      },
    ];

    return NextResponse.json({ success: true, results: mockExtractedData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
