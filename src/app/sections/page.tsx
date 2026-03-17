"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SectionItem = {
  id: string;
  name: string;
  type: string;
  _count: { cows: number };
};

type BarnItem = {
  id: string;
  name: string;
  sections: SectionItem[];
  _count: { cows: number };
};

export default function SectionsPage() {
  const [barns, setBarns] = useState<BarnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSections() {
      try {
        const res = await fetch("/api/sections");
        const json = await res.json();
        if (json.success) {
          setBarns(json.data);
        } else {
          setError(json.error || "Ошибка загрузки списка секций");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSections();
  }, []);

  if (loading) return <div className="p-8">Загрузка секций...</div>;
  if (error) return <div className="p-8 text-red-500">Ошибка: {error}</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Карта местности (Размещение)</h1>
      </div>

      {barns.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <div className="text-gray-500">
            В системе пока нет ни одного здания или секции.
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {barns.map((barn) => (
            <div key={barn.id} className="space-y-4">
              <div className="flex items-center space-x-3 border-b pb-2">
                <span className="text-2xl">🛖</span>
                <h2 className="text-2xl font-semibold">{barn.name}</h2>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Всего: {barn._count.cows} гол.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {barn.sections.length === 0 ? (
                  <div className="col-span-full text-sm text-gray-500 italic">Секций пока нет</div>
                ) : (
                  barn.sections.map((section) => (
                    <Link href={`/sections/${section.id}`} key={section.id} className="block transition-transform hover:-translate-y-1">
                      <div className="h-full bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="p-4 pb-2">
                          <div className="text-lg font-semibold text-gray-800 flex justify-between">
                            <span>{section.name}</span>
                            <span className="text-base font-normal text-gray-500">
                              {section._count.cows} 🐄
                            </span>
                          </div>
                        </div>
                        <div className="p-4 pt-0">
                          <p className="text-xs text-gray-400 capitalize">{section.type || "Неизвестный тип"}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
