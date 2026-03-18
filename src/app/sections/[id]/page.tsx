"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, ArrowRightCircle, ArrowLeftCircle, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

type MovementRecord = {
  cowId: string;
  number: string;
  status: string;
  date: string;
};

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
  currentCows: CowInSection[];
  barn: {
    name: string;
    farm: {
      name: string;
    };
  } | null;
  _count: {
    currentCows: number;
  };
  recentMovements?: {
    arrivals: MovementRecord[];
    departures: MovementRecord[];
  };
};

export default function SectionDetailsPage() {
  const { id } = useParams();
  const [section, setSection] = useState<SectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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

  if (loading) return <div className="p-8 text-white">Загрузка информации о секции...</div>;
  if (error) return <div className="p-8 text-red-500">Ошибка: {error}</div>;
  if (!section) return <div className="p-8 text-white">Секция не найдена.</div>;

  const typeStr = (section.type || "").toLowerCase();
  let headerColor = "bg-white/5 border-white/10";
  let icon = "🐄";
  if (typeStr.includes("родильн") || typeStr.includes("отел") || typeStr.includes("calving") || typeStr.includes("maternity")) {
    headerColor = "bg-[#7FC9AA]/10 border-[#7FC9AA]/30";
    icon = "🤰";
  } else if (typeStr.includes("дойная") || typeStr.includes("milk")) {
    headerColor = "bg-blue-500/10 border-blue-500/30";
    icon = "🥛";
  } else if (typeStr.includes("сухостой") || typeStr.includes("dry")) {
    headerColor = "bg-amber-500/10 border-amber-500/30";
    icon = "💤";
  } else if (typeStr.includes("телят") || typeStr.includes("calf") || typeStr.includes("heifers")) {
    headerColor = "bg-purple-500/10 border-purple-500/30";
    icon = "🍼";
  }

  const filteredCows = (section.currentCows || []).filter((cow) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return cow.number.toLowerCase().includes(s) || (cow.group?.name || "").toLowerCase().includes(s);
  });

  return (
    <AppLayout title={`Секция: ${section.name}`}>
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-2">
        <Link href="/sections" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
          ← Назад к карте размещения
        </Link>
      </div>

      {/* Header Block */}
      <div className={`card p-6 border ${headerColor}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
             <div className="text-5xl bg-black/20 p-3 rounded-xl">{icon}</div>
             <div>
               <h1 className="text-3xl font-bold text-white mb-1">{section.name}</h1>
               <div className="flex gap-3">
                 <span className="text-sm px-2 py-0.5 rounded bg-black/20 text-gray-300 capitalize">{section.type || "Стандартная"}</span>
                 <span className="text-sm px-2 py-0.5 rounded bg-white/5 text-gray-400">
                   📍 {section.barn ? `${section.barn.farm.name} — ${section.barn.name}` : "Без здания"}
                 </span>
               </div>
             </div>
          </div>
          <div className="text-right bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="text-4xl font-bold text-white leading-none">
              {section._count?.currentCows || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Голов сейчас</div>
          </div>
        </div>
      </div>

      {/* Movement History Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Arrivals */}
         <div className="card !p-0 overflow-hidden">
           <div className="p-4 border-b border-white/10 bg-[#7FC9AA]/5 flex justify-between items-center">
             <h3 className="text-lg font-semibold text-white flex items-center gap-2">
               <ArrowRightCircle className="w-5 h-5 text-[#7FC9AA]" />
               Поступления (30 дн)
             </h3>
             <span className="badge bg-[#7FC9AA]/20 text-[#7FC9AA] border-[#7FC9AA]/30">
               +{section.recentMovements?.arrivals?.length || 0}
             </span>
           </div>
           <div className="max-h-64 overflow-y-auto">
              {!section.recentMovements?.arrivals?.length ? (
                <div className="p-6 text-center text-gray-500 italic">Нет прибывших животных</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {section.recentMovements.arrivals.map((m, i) => (
                    <div key={`arr-${m.cowId}-${i}`} className="p-3 hover:bg-white/5 flex justify-between items-center px-4">
                      <div>
                        <Link href={`/herd/${m.cowId}`} className="font-medium text-white hover:text-blue-400">
                           #{m.number}
                        </Link>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(m.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                         {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
           </div>
         </div>

         {/* Departures */}
         <div className="card !p-0 overflow-hidden">
           <div className="p-4 border-b border-white/10 bg-amber-500/5 flex justify-between items-center">
             <h3 className="text-lg font-semibold text-white flex items-center gap-2">
               <ArrowLeftCircle className="w-5 h-5 text-amber-500" />
               Выбытия (30 дн)
             </h3>
             <span className="badge bg-amber-500/20 text-amber-400 border-amber-500/30">
               -{section.recentMovements?.departures?.length || 0}
             </span>
           </div>
           <div className="max-h-64 overflow-y-auto">
              {!section.recentMovements?.departures?.length ? (
                <div className="p-6 text-center text-gray-500 italic">Нет выбывших животных</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {section.recentMovements.departures.map((m, i) => (
                    <div key={`dep-${m.cowId}-${i}`} className="p-3 hover:bg-white/5 flex justify-between items-center px-4">
                      <div>
                        <Link href={`/herd/${m.cowId}`} className="font-medium text-white hover:text-blue-400">
                           #{m.number}
                        </Link>
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(m.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                         {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
           </div>
         </div>
      </div>

      {/* Composition Table */}
      <div className="card !p-0 overflow-hidden mt-8">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
             <CheckCircle2 className="w-5 h-5 text-gray-400" />
             Текущий состав секции
          </h3>
          <input
            type="text"
            placeholder="🔍 Поиск по номеру или группе..."
            className="input !py-1.5 !text-sm w-64 bg-black/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="p-0">
          {(filteredCows.length === 0) ? (
            <div className="text-center p-8 text-gray-400">
              {search ? "Животные по запросу не найдены." : "В этой секции сейчас нет размещенных животных."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-black/20">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">AFI ID</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Группа</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Статус</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Лактация</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">DIM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCows.map((cow, i) => (
                    <tr key={`cow-${cow.id || cow.number}-${i}`} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        <Link href={`/herd/${cow.id}`} className="hover:text-blue-400 hover:underline transition-colors">
                          {cow.number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {cow.group ? (
                          <Link href={`/groups/${cow.group.id}`} className="text-blue-400 hover:underline">
                            {cow.group.name}
                          </Link>
                        ) : (
                          <span className="text-gray-500 italic">Нет группы</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                          cow.status === "active" || cow.status === "Дойная"
                            ? "bg-[#64A68B]/10 text-[#7FC9AA] border-[#64A68B]/20" 
                            : "bg-white/5 text-gray-300 border-white/10"
                        }`}>
                          {cow.status === "active" ? "Активна" : cow.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 font-mono">{cow.lactation ?? "-"}</td>
                      <td className="px-6 py-4 text-right text-gray-300 font-mono">{cow.dim ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
