"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type CowInSection = {
  id: string;
  number: string;
  status: string;
  dim: number | null;
  lactation: number | null;
  group: {
    id: string;
    name: string;
  } | null;
};

type SectionDetail = {
  id: string;
  name: string;
  type: string;
  cows: CowInSection[];
  barn: {
    name: string;
    farm: {
      name: string;
    };
  } | null;
  _count: {
    currentCows: number;
  };
};

export default function SectionDetailsPage() {
  const { id } = useParams();
  const [section, setSection] = useState<SectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSection() {
      try {
        const res = await fetch(`/api/sections/${id}`);
        const json = await res.json();
        if (json.success) {
          setSection(json.data);
        } else {
          setError(json.error || "Ошибка загрузки секции");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchSection();
  }, [id]);

  if (loading) return <div className="p-8">Загрузка информации о секции...</div>;
  if (error) return <div className="p-8 text-red-500">Ошибка: {error}</div>;
  if (!section) return <div className="p-8">Секция не найдена.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/sections" className="text-gray-500 hover:text-black transition-colors">
          ← К карте (размещение)
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Секция: {section.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 border-l-4 border-l-blue-500 bg-white shadow-sm rounded-lg p-6">
          <div className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Тип секции</h3>
          </div>
          <div>
            <div className="text-2xl font-bold capitalize">{section.type || "Неизвестно"}</div>
          </div>
        </div>
        
        <div className="col-span-1 border-l-4 border-l-purple-500 bg-white shadow-sm rounded-lg p-6">
          <div className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Расположение</h3>
          </div>
          <div>
            <div className="text-lg font-bold truncate">
              {section.barn ? `${section.barn.farm.name} — ${section.barn.name}` : "Без здания"}
            </div>
          </div>
        </div>
        
        <div className="col-span-1 border-l-4 border-l-green-500 bg-white shadow-sm rounded-lg p-6">
          <div className="pb-2">
            <h3 className="text-sm font-medium text-gray-500">Наполнение</h3>
          </div>
          <div>
            <div className="text-2xl font-bold">{section._count?.currentCows || 0} гол.</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Список размещенных животных</h3>
        </div>
        <div className="p-0">
          {(!section.cows || section.cows.length === 0) ? (
            <div className="text-center p-6 text-gray-500 bg-gray-50">
              В этой секции сейчас нет размещенных животных.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Номер (ID)</th>
                    <th className="px-6 py-3">Группа</th>
                    <th className="px-6 py-3 text-right">Лактация</th>
                    <th className="px-6 py-3 text-right">Дни лактации (DIM)</th>
                  </tr>
                </thead>
                <tbody>
                  {section.cows.map((cow) => (
                    <tr key={cow.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        Внутр. ID {cow.number}
                      </td>
                      <td className="px-6 py-4">
                        {cow.group ? (
                          <Link href={`/groups/${cow.group.id}`} className="text-blue-600 hover:underline">
                            {cow.group.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400 italic">Нет группы</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">{cow.lactation ?? "-"}</td>
                      <td className="px-6 py-4 text-right">{cow.dim ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
