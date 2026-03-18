"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { format, subDays } from "date-fns";
import { ArrowLeft, Users, Calendar, Activity, TrendingUp, ChevronRight, Calculator, CheckCircle2 } from "lucide-react";
import DateRangePicker from "@/components/ui/DateRangePicker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getSystemDate } from "@/lib/systemDate";

type CowInGroup = {
  id: string;
  number: string;
  status: string;
  dim: number | null;
  lactation: number | null;
};

type GroupDetail = {
  id: string;
  name: string;
  type: string;
  cows: CowInGroup[];
  _count: {
    cows: number;
    feedRecords: number;
  };
};

type GroupStats = {
  totalFeed: number;
  totalMilk: number;
  avgYieldPerHead: number;
  avgFeedPerHead: number;
  feedPerKgMilk: number;
  cowDaysInPeriod: number;
  feedRecordsCount: number;
  daily: { date: string, feed: number, milk: number, cowDays: number, feedHeadDays: number }[];
};

export default function GroupDetailsPage() {
  const { id } = useParams();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to last 7 days including today
  const [dateFrom, setDateFrom] = useState<string>(format(subDays(getSystemDate(), 6), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState<string>(format(getSystemDate(), "yyyy-MM-dd"));

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  useEffect(() => {
    async function fetchGroup() {
      try {
        const res = await fetch(`/api/groups/${id}`);
        const json = await res.json();
        if (json.success) {
          setGroup(json.data);
        } else {
          setError(json.error || "Ошибка загрузки группы");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchGroup();
  }, [id]);

  useEffect(() => {
    async function fetchStats() {
      setLoadingStats(true);
      try {
        const res = await fetch(`/api/groups/${id}/stats?from=${dateFrom}&to=${dateTo}&_t=${Date.now()}`);
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoadingStats(false);
      }
    }
    if (id && dateFrom && dateTo) fetchStats();
  }, [id, dateFrom, dateTo]);

  if (loading) return <div className="page-container p-8 text-white">Загрузка информации о группе...</div>;
  if (error || !group) {
    notFound();
  }

  return (
    <div className="page-container space-y-8">
      {/* Header */}
      <div className="page-header border-b border-white/10 pb-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Link href="/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
             Главное меню
          </Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <Link href="/groups" className="hover:text-white transition-colors flex items-center gap-1">
            Размещение
          </Link>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <span className="text-gray-300 font-medium">{group.name}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-[#A1BFE8]" />
              {group.name}
              <span className="badge badge-primary text-sm ml-2">{group.type || "Группа"}</span>
            </h1>
          </div>
          <div className="flex justify-end min-w-[300px]">
            <DateRangePicker from={dateFrom} to={dateTo} onChange={handleDateChange} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loadingStats ? (
        <div className="kpi-grid opacity-50 animate-pulse">
           {[...Array(5)].map((_, i) => <div key={i} className="kpi-card min-h-[140px]"></div>)}
        </div>
      ) : stats ? (
        <div className="kpi-grid">
          {/* Суммарный надой */}
          <div className="kpi-card blue">
            <div className="kpi-header">
              <span className="kpi-label">Суммарный надой</span>
              <div className="kpi-icon blue">🥛</div>
            </div>
            <div className="kpi-value">
              {stats.totalMilk > 0 ? stats.totalMilk.toFixed(0) : "0"}
              <span className="kpi-unit">кг</span>
            </div>
            <span className="kpi-change neutral">
              За выбранный период
            </span>
          </div>
          
          {/* Надой на голову */}
          <div className="kpi-card green">
            <div className="kpi-header">
              <span className="kpi-label">Надой на голову</span>
              <div className="kpi-icon green">📈</div>
            </div>
            <div className="kpi-value">
              {stats.avgYieldPerHead > 0 ? stats.avgYieldPerHead.toFixed(1) : "0"}
              <span className="kpi-unit">кг/дн</span>
            </div>
            <span className="kpi-change neutral">
              В среднем за период
            </span>
          </div>

          {/* Корм на голову */}
          <div className="kpi-card amber">
            <div className="kpi-header">
              <span className="kpi-label">Корм на голову</span>
              <div className="kpi-icon amber">🌾</div>
            </div>
            <div className="kpi-value">
              {stats.avgFeedPerHead > 0 ? stats.avgFeedPerHead.toFixed(1) : "0"}
              <span className="kpi-unit">кг/дн</span>
            </div>
            <span className="kpi-change neutral">
              Физического веса
            </span>
          </div>

          {/* Корм на кг молока */}
          <div className="kpi-card purple">
            <div className="kpi-header">
              <span className="kpi-label">Корм на кг молока</span>
              <div className="kpi-icon purple">⚖️</div>
            </div>
            <div className="kpi-value">
              {stats.feedPerKgMilk > 0 ? stats.feedPerKgMilk.toFixed(2) : "0"}
              <span className="kpi-unit">кг/кг</span>
            </div>
            <span className="kpi-change neutral">
              Конверсия корма
            </span>
          </div>

          {/* Gross Output/Input */}
          <div className="kpi-card orange flex flex-col justify-between">
             <div className="kpi-header">
               <span className="kpi-label">Gross Output/Input</span>
               <div className="kpi-icon orange">📊</div>
             </div>
             <div className="kpi-value" style={{ fontSize: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', lineHeight: '1.1' }}>
                   <div>{stats.totalMilk > 0 ? stats.totalMilk.toFixed(0) : "0"} <span className="text-[12px] font-normal text-[var(--text-secondary)]">кг рез.</span></div>
                   <div style={{ height: '1px', background: 'var(--border-subtle)', width: '80%' }}></div>
                   <div>{stats.totalFeed > 0 ? stats.totalFeed.toFixed(0) : "0"} <span className="text-[12px] font-normal text-[var(--text-secondary)]">кг зат.</span></div>
                </div>
             </div>
             <span className="kpi-change neutral mt-1" style={{ display: 'block' }}>
                {stats.totalFeed > 0 && stats.totalMilk > 0 
                  ? `Коэф: ${(stats.totalMilk / stats.totalFeed).toFixed(2)}`
                  : "Коэф: 0"
                }
             </span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-gray-400 text-sm text-center">
            Нет данных для расчёта показателей
        </div>
      )}

      {/* Charts */}
      {!loadingStats && stats && stats.daily && stats.daily.length > 0 && (
        <div className="grid grid-cols-1 gap-6 mt-8">
          <div className="kpi-card !p-6 border-white/5 relative overflow-hidden">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#A1BFE8]" />
              Динамика валового надоя по дням
            </h3>
            <div className="w-full" style={{ height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.daily} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff66" 
                    tickFormatter={(val) => val.substring(8, 10) + '.' + val.substring(5, 7)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff66" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => Math.round(val).toString()}
                    tick={{ fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#ffffff1a', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#A1BFE8' }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)} кг`, 'Надой']}
                    labelFormatter={(label: any) => String(label).split('-').reverse().join('.')}
                    cursor={{ fill: '#ffffff0a' }}
                  />
                  <Bar dataKey="milk" name="Надой" fill="#A1BFE8" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="kpi-card !p-6 border-white/5 relative overflow-hidden">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FDEBD3]" />
              Динамика скармливания по дням (в физ. весе)
            </h3>
            <div className="w-full" style={{ height: 256 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.daily} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff66" 
                    tickFormatter={(val) => val.substring(8, 10) + '.' + val.substring(5, 7)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff66" 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => Math.round(val).toString()}
                    tick={{ fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#ffffff1a', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#FDEBD3' }}
                    formatter={(value: any) => [`${Number(value).toFixed(1)} кг`, 'Корм (физ. вес)']}
                    labelFormatter={(label: any) => String(label).split('-').reverse().join('.')}
                    cursor={{ fill: '#ffffff0a' }}
                  />
                  <Bar dataKey="feed" name="Корм" fill="#FDEBD3" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Composition Table */}
      <div className="kpi-card !p-0 overflow-hidden mt-8">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
             <CheckCircle2 className="w-5 h-5 text-gray-400" />
             Текущий состав группы ({group._count.cows} гол.)
          </h3>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Животные на сегодняшний день</span>
        </div>
        <div className="p-0">
          {group.cows.length === 0 ? (
            <div className="text-center p-8 text-gray-400">
              В этой группе пока нет привязанных животных.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-black/20">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">AFI ID</th>
                    <th className="px-6 py-4 font-semibold tracking-wider">Статус</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Лактация</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">Дни лактации (DIM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {group.cows.map((cow: any, i: number) => (
                    <tr key={`${cow.id || i}-${i}`} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">
                        <Link href={`/herd/${cow.id}`} className="hover:text-blue-400 hover:underline transition-colors">
                          {cow.number}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                          cow.status === "active" 
                            ? "bg-[#64A68B]/10 text-[#7FC9AA] border-[#64A68B]/20" 
                            : "bg-white/5 text-gray-300 border-white/10"
                        }`}>
                          {cow.status === "active" ? "Активна" : cow.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 font-mono">
                         {cow.lactation ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300 font-mono">
                         {cow.dim ?? "-"}
                      </td>
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
