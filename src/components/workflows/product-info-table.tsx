"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, LayoutGrid, List, Minus } from "lucide-react";

import { platformLabels } from "@/lib/platform-labels";

export type ProductInfoRow = {
  id: number;
  name: string;
  platform: string;
  category: string | null;
  price: string | null;
  percent: number;
  missing: string[];
  fieldChecks: Array<{ field: string; ok: boolean }>;
  updatedAt: string;
};

type FilterKey = "all" | "todo" | "done";
type SortKey = "percent-desc" | "percent-asc" | "recent";

const filterTabs: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "todo", label: "待补全" },
  { key: "done", label: "已完善" },
];

/**
 * 商品信息体检表：筛选（全部/待补全/已完善）+ 排序（完整度/更新时间）+ 双视图
 * （明细列表 / 字段矩阵）。全部数据由服务端一次性下发，切换仅在前端完成。
 */
export function ProductInfoTable({ rows }: { rows: ProductInfoRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("percent-desc");
  const [matrixView, setMatrixView] = useState(false);

  const counts = useMemo(
    () => ({
      all: rows.length,
      todo: rows.filter((row) => row.missing.length > 0).length,
      done: rows.filter((row) => row.missing.length === 0).length,
    }),
    [rows],
  );

  const visibleRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (filter === "todo") return row.missing.length > 0;
      if (filter === "done") return row.missing.length === 0;
      return true;
    });
    const sorted = [...filtered];
    if (sort === "percent-desc") sorted.sort((a, b) => b.percent - a.percent);
    if (sort === "percent-asc") sorted.sort((a, b) => a.percent - b.percent);
    if (sort === "recent") sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return sorted;
  }, [rows, filter, sort]);

  const fieldNames = rows[0]?.fieldChecks.map((item) => item.field) ?? [];

  return (
    <div>
      {/* 工具栏：筛选 + 排序 + 视图切换 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-slate-100 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === tab.key
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
              <span className={`ml-1 tabular-nums ${filter === tab.key ? "text-orange-100" : "text-slate-400"}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 outline-none transition focus:border-orange-400"
            aria-label="排序方式"
          >
            <option value="percent-desc">完整度 · 从高到低</option>
            <option value="percent-asc">完整度 · 从低到高</option>
            <option value="recent">最近更新</option>
          </select>
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => setMatrixView(false)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                matrixView ? "text-slate-400 hover:text-slate-600" : "bg-slate-100 text-slate-700"
              }`}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              列表
            </button>
            <button
              type="button"
              onClick={() => setMatrixView(true)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                matrixView ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              矩阵
            </button>
          </div>
        </div>
      </div>

      {visibleRows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">当前筛选下没有商品</p>
      ) : matrixView ? (
        <FieldMatrix rows={visibleRows} fieldNames={fieldNames} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold tracking-wide text-slate-400">
                <th className="pb-2.5 pr-3">商品</th>
                <th className="pb-2.5 pr-3">平台</th>
                <th className="pb-2.5 pr-3">售价</th>
                <th className="pb-2.5 pr-3 w-40">信息完整度</th>
                <th className="pb-2.5 pr-3">缺失字段</th>
                <th className="pb-2.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleRows.map((row) => (
                <tr key={row.id} className="transition hover:bg-orange-50/40">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-slate-800">{row.name}</p>
                    <p className="text-xs text-slate-400">
                      ID {row.id}
                      {row.category ? ` · ${row.category}` : ""}
                    </p>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {platformLabels[row.platform] ?? row.platform}
                    </span>
                  </td>
                  <td className="py-3 pr-3 tabular-nums text-slate-600">
                    {row.price ? `¥${row.price}` : "-"}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            row.percent >= 90 ? "bg-emerald-500" : row.percent >= 60 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${row.percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-slate-700">{row.percent}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    {row.missing.length === 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        已完善
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.missing.map((field) => (
                          <span
                            key={field}
                            className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/products/${row.id}?tab=overview`}
                      className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
                    >
                      去补全
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** 字段矩阵视图：商品 × 关键字段的 ✓/— 对照，缺失项一眼定位。 */
function FieldMatrix({ rows, fieldNames }: { rows: ProductInfoRow[]; fieldNames: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs font-semibold tracking-wide text-slate-400">
            <th className="pb-2.5 pr-3">商品</th>
            {fieldNames.map((field) => (
              <th key={field} className="pb-2.5 pr-3 text-center whitespace-nowrap">
                {field}
              </th>
            ))}
            <th className="pb-2.5 pr-3 text-center">完整度</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-orange-50/40">
              <td className="py-2.5 pr-3 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
              {row.fieldChecks.map((check) => (
                <td key={check.field} className="py-2.5 pr-3 text-center">
                  {check.ok ? (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  )}
                </td>
              ))}
              <td className="py-2.5 pr-3 text-center text-xs font-semibold tabular-nums text-slate-700">
                {row.percent}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
