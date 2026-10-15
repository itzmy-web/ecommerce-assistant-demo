"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";

export type ReviewActionItem = {
  key: string;
  productName: string;
  action: string;
  period: string;
};

/**
 * 本期行动清单：聚合全部商品复盘的「下一步动作」，支持逐项勾选与进度回显。
 * 勾选状态仅存前端，刷新即重置——演示版不做持久化。
 */
export function ActionChecklist({ items }: { items: ReviewActionItem[] }) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  const doneCount = useMemo(() => Object.values(done).filter(Boolean).length, [done]);
  const percent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">暂未聚合到行动项，先为商品生成周期复盘。</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-semibold tabular-nums text-slate-500">
          {doneCount}/{items.length} 已完成
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const checked = !!done[item.key];
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => setDone((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`flex w-full items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition ${
                  checked
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-100 bg-white hover:border-orange-200 hover:bg-orange-50/40"
                }`}
              >
                {checked ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm ${checked ? "text-slate-400 line-through" : "text-slate-700"}`}
                  >
                    {item.action}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <ListChecks className="h-3 w-3" aria-hidden="true" />
                    {item.productName} · {item.period}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
