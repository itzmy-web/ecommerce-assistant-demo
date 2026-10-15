"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FlaskConical,
  Link2,
  Megaphone,
  Palette,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { platformLabels } from "@/lib/platform-labels";
import type { AdExperimentSummary, PromotionLink } from "@/types";

export type AdsProductCardData = {
  productId: number;
  name: string;
  platform: string;
  advice: string;
  experiments: AdExperimentSummary[];
  links: PromotionLink[];
  planCount: number;
};

type FilterKey = "all" | "active" | "empty";

const filterTabs: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "全部商品" },
  { key: "active", label: "有投放实验" },
  { key: "empty", label: "待启动投放" },
];

function decisionMeta(decision: string): { label: string; className: string } {
  if (decision === "scale") return { label: "放量", className: "bg-emerald-50 text-emerald-600 ring-emerald-200" };
  if (decision === "keep") return { label: "维持", className: "bg-amber-50 text-amber-600 ring-amber-200" };
  if (decision === "pause") return { label: "暂停", className: "bg-rose-50 text-rose-600 ring-rose-200" };
  return { label: "观察", className: "bg-slate-100 text-slate-500 ring-slate-200" };
}

function statusMeta(status: string): { label: string; className: string } {
  if (status === "running") return { label: "投放中", className: "bg-sky-50 text-sky-600" };
  if (status === "measured") return { label: "已测出", className: "bg-emerald-50 text-emerald-600" };
  if (status === "paused") return { label: "已暂停", className: "bg-slate-100 text-slate-500" };
  return { label: "草稿", className: "bg-amber-50 text-amber-600" };
}

function roiTone(roi: string | null): string {
  const value = Number(roi);
  if (!Number.isFinite(value)) return "text-slate-400";
  if (value >= 3) return "text-emerald-600";
  if (value >= 2) return "text-amber-600";
  return "text-rose-600";
}

/** 投放建议商品卡列表：服务端下发聚合数据，前端只做筛选切换。 */
export function AdsProductGrid({ items }: { items: AdsProductCardData[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(
    () => ({
      all: items.length,
      active: items.filter((item) => item.experiments.length > 0).length,
      empty: items.filter((item) => item.experiments.length === 0).length,
    }),
    [items],
  );

  const visible = items.filter((item) => {
    if (filter === "active") return item.experiments.length > 0;
    if (filter === "empty") return item.experiments.length === 0;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <p className="text-xs text-slate-400">
          共 {visible.length} 个商品 · {visible.reduce((sum, item) => sum + item.experiments.length, 0)} 个实验
        </p>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">当前筛选下没有商品</p>
      ) : (
        <div className="space-y-5">
          {visible.map((item) => (
            <AdsProductCard key={item.productId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function AdsProductCard({ item }: { item: AdsProductCardData }) {
  const { experiments, links } = item;
  const maxClicks = Math.max(1, ...links.map((link) => link.click_count));

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* 卡片头：商品信息 + 一句建议 */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm shadow-orange-500/30">
            <Megaphone className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{item.name}</h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-md bg-white px-1.5 py-0.5 ring-1 ring-slate-200">
                {platformLabels[item.platform] ?? item.platform}
              </span>
              <span className="flex items-center gap-1">
                <FlaskConical className="h-3 w-3" aria-hidden="true" />
                实验 {experiments.length}
              </span>
              <span className="flex items-center gap-1">
                <Palette className="h-3 w-3" aria-hidden="true" />
                创意 {item.planCount} 套
              </span>
              <span className="flex items-center gap-1">
                <Link2 className="h-3 w-3" aria-hidden="true" />
                链接 {links.length} 条
              </span>
            </p>
          </div>
        </div>
        <Link
          href={`/products/${item.productId}?tab=ads`}
          className="inline-flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
        >
          投放工作台
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* 建议 Callout */}
        <p className="flex items-start gap-2 rounded-xl bg-orange-50 px-3.5 py-2.5 text-sm text-orange-700">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {item.advice}
        </p>

        {experiments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold tracking-wide text-slate-400">
                  <th className="pb-2 pr-3">实验</th>
                  <th className="pb-2 pr-3">日预算</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2 pr-3 text-right">消耗</th>
                  <th className="pb-2 pr-3 text-right">收入</th>
                  <th className="pb-2 pr-3 text-right">ROI</th>
                  <th className="pb-2">结论</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {experiments.map((experiment) => {
                  const decision = decisionMeta(experiment.decision);
                  const status = statusMeta(experiment.status);
                  return (
                    <tr key={experiment.ad_experiment_id} className="transition hover:bg-slate-50/60">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-slate-800">{experiment.name}</p>
                        <p className="text-xs text-slate-400">
                          {experiment.record_count} 条数据 · {experiment.period_start?.slice(0, 10) ?? "—"} 起
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-slate-600">
                        ¥{experiment.daily_budget ?? "—"}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">
                        ¥{Number(experiment.spend).toFixed(0)}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-slate-600">
                        ¥{Number(experiment.revenue).toFixed(0)}
                      </td>
                      <td className={`py-2.5 pr-3 text-right font-semibold tabular-nums ${roiTone(experiment.roi)}`}>
                        {experiment.roi ?? "—"}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${decision.className}`}
                        >
                          {decision.label}
                        </span>
                        {experiment.decision_reason ? (
                          <p className="mt-1 text-xs text-slate-400">{experiment.decision_reason}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-400">
            <TrendingDown className="h-4 w-4" aria-hidden="true" />
            该商品暂无投放实验，可在投放工作台创建 A/B 实验积累数据。
          </p>
        )}

        {links.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500">
              <BarChart3 className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
              推广链接点击分布
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {links.map((link) => (
                <div key={link.id} className="rounded-xl border border-slate-100 px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-slate-700">{link.label}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">{link.click_count} 点击</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400"
                      style={{ width: `${Math.max(5, (link.click_count / maxClicks) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
