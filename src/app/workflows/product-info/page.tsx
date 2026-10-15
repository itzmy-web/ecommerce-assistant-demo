import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Package,
  Search,
  Stethoscope,
} from "lucide-react";

import { CompletenessBarChart } from "@/components/charts/completeness-bar-chart";
import { ProductInfoTable } from "@/components/workflows/product-info-table";
import type { ProductInfoRow } from "@/components/workflows/product-info-table";
import {
  CompletenessRing,
  EmptyState,
  KpiCard,
  MiniBar,
  SectionCard,
  WorkflowHero,
} from "@/components/workflows/shared";
import { getProducts } from "@/lib/api";
import type { Product } from "@/types";

// 强制动态渲染：完整度依赖运行时商品数据，避免 build 时物化。
export const dynamic = "force-dynamic";

/** 体检字段清单：与商品关键运营字段一一对应，顺序即矩阵列顺序。 */
const CHECK_FIELDS: Array<{ field: string; check: (p: Product) => boolean; hint: string }> = [
  { field: "类目", check: (p) => !!p.category, hint: "决定类目流量池" },
  { field: "售价", check: (p) => !!p.price, hint: "影响价格带定位" },
  { field: "成本", check: (p) => !!p.cost, hint: "核算利润与 ROI 基线" },
  { field: "目标人群", check: (p) => !!p.target_audience, hint: "投放定向的依据" },
  { field: "卖点", check: (p) => (p.selling_points?.length ?? 0) > 0, hint: "创意与文案原料" },
  { field: "商品链接", check: (p) => !!p.product_url, hint: "推广链接归因入口" },
  { field: "主图", check: (p) => (p.images?.length ?? 0) > 0, hint: "素材生成与 A/B 实验素材" },
  { field: "平台状态", check: (p) => !!p.platform_status, hint: "在售 / 下架状态同步" },
];

/** 计算单个商品的信息完整度：逐项检查关键字段是否填写。 */
function evaluateCompleteness(p: Product) {
  const fieldChecks = CHECK_FIELDS.map(({ field, check }) => ({ field, ok: check(p) }));
  const done = fieldChecks.filter((item) => item.ok).length;
  const missing = fieldChecks.filter((item) => !item.ok).map((item) => item.field);
  return {
    percent: Math.round((done / fieldChecks.length) * 100),
    missing,
    fieldChecks,
  };
}

/**
 * 「补商品信息」独立工作台：汇总全部商品的信息完整度，标红缺失字段，
 * 一键直达对应商品的运营闭环补全，避免单品运营入口只跳到某个商品 tab。
 */
export default async function ProductInfoWorkflowPage() {
  const products = await getProducts();
  const rows: ProductInfoRow[] = products.map((p) => {
    const { percent, missing, fieldChecks } = evaluateCompleteness(p);
    return {
      id: p.id,
      name: p.name,
      platform: p.platform,
      category: p.category,
      price: p.price,
      percent,
      missing,
      fieldChecks,
      updatedAt: p.updated_at,
    };
  });
  const avg = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.percent, 0) / rows.length)
    : 0;
  const needFix = rows.filter((r) => r.missing.length > 0).length;
  const doneCount = rows.length - needFix;

  // 字段缺失洞察：按缺失次数倒序，前两名标「最常缺失」。
  const missingStats = CHECK_FIELDS.map(({ field, hint }) => ({
    field,
    hint,
    count: rows.filter((row) => row.missing.includes(field)).length,
  }))
    .filter((stat) => stat.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxMissing = Math.max(1, ...missingStats.map((stat) => stat.count));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 lg:px-8">
      <WorkflowHero
        eyebrow="单品运营 · 补商品信息"
        title="商品信息体检台"
        description="一次性盘点全部商品的关键字段缺失情况，定位待补全商品并直达补全入口。字段越完整，诊断、创意与投放的命中率越高。"
        icon={Stethoscope}
      >
        <div className="rounded-2xl bg-white/15 px-5 py-4 text-center ring-1 ring-white/30 backdrop-blur-sm">
          <CompletenessRing percent={avg} size={104} />
          <p className="mt-2 text-xs text-orange-100">全店商品平均完整度</p>
        </div>
      </WorkflowHero>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="在管商品" value={String(products.length)} hint="当前工作台在管商品" icon={Package} />
        <KpiCard
          label="平均完整度"
          value={`${avg}%`}
          hint="8 项关键字段均值"
          icon={Gauge}
          tone={avg >= 90 ? "emerald" : avg >= 60 ? "amber" : "rose"}
        />
        <KpiCard
          label="待补全商品"
          value={String(needFix)}
          hint="存在缺失字段的商品数"
          icon={AlertCircle}
          tone={needFix > 0 ? "rose" : "emerald"}
        />
        <KpiCard label="已完善商品" value={String(doneCount)} hint="8 项字段全部填写" icon={CheckCircle2} tone="emerald" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="完整度排行" icon={Gauge} className="lg:col-span-2">
          <CompletenessBarChart
            items={rows.map((row) => ({ name: row.name, percent: row.percent }))}
          />
        </SectionCard>

        <SectionCard title="字段缺失洞察" icon={Search}>
          {missingStats.length === 0 ? (
            <EmptyState text="全部商品字段齐全，保持这个节奏。" icon={CheckCircle2} />
          ) : (
            <ul className="space-y-3">
              {missingStats.map((stat, index) => (
                <li key={stat.field}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      {index < 2 ? (
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-500">
                          最常缺失
                        </span>
                      ) : null}
                      {stat.field}
                    </span>
                    <span className="text-xs tabular-nums text-slate-400">
                      {stat.count}/{products.length} 商品缺失
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <MiniBar value={stat.count} max={maxMissing} tone={index < 2 ? "rose" : "orange"} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/imports"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-orange-600 transition hover:text-orange-700"
          >
            批量导入商品信息 →
          </Link>
        </SectionCard>
      </div>

      <SectionCard title="商品体检明细" icon={ClipboardCheck}>
        <ProductInfoTable rows={rows} />
      </SectionCard>
    </main>
  );
}
