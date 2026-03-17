import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export function useDateParams(defaultDaysAgo: number = 30) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlFrom = searchParams.get("from");
  const urlTo = searchParams.get("to");

  const [dateFrom, setDateFrom] = useState(urlFrom || getDaysAgo(defaultDaysAgo));
  const [dateTo, setDateTo] = useState(urlTo || getToday());

  useEffect(() => {
    if (urlFrom && urlFrom !== dateFrom) setDateFrom(urlFrom);
    if (urlTo && urlTo !== dateTo) setDateTo(urlTo);
  }, [urlFrom, urlTo]);

  const setDateRange = useCallback(
    (from: string, to: string) => {
      setDateFrom(from);
      setDateTo(to);

      const params = new URLSearchParams(searchParams.toString());
      params.set("from", from);
      params.set("to", to);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, searchParams, pathname]
  );

  return { dateFrom, dateTo, setDateRange };
}
