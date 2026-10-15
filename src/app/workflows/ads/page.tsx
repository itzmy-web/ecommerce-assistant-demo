import Link from "next/link";
import {
  BarChart3,
  CircleDollarSign,
  Flame,
  FlaskConical,
  Megaphone,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { AdsRoiChart } from "@/components/charts/ads-roi-chart";
import { AdsProductGrid } from "@/components/workflows/ads-product-grid";
import type { AdsProductCardData } from "@/components/workflows/ads-product-grid";
import { EmptyState, KpiCard, SectionCard, WorkflowHero } from "@/components/workflows/shared";
import { getAdExperimentDashboard, getProduct, getProducts } from "@/lib/api";
import type { AdExperimentDashboard } from "@/types";

// 强制动态渲染：投放数据依赖运行时商品数据，避免 build 时物化。
export const dynamic = "force-dynamic";

/** 基于投放看板数据，推导一句可执行建议（演示版规则化生成，非调用大模型）。 */
function deriveAdvice(dash: AdExperimentDashboard | null): string {
  if (!dash) return "暂无投放实验数据，建议先创建主图 A/B 实验积累数据。";
  if (dash.best_experiment) {
    return `建议对「${dash.best_experiment.name}」追加预算——当前 ROI ${dash.best_experiment.roi ?? "—"} 表现最优。`;
  }
  if (dash.overall_roi && Number(dash.overall_roi) < 3) {
    return `整体 ROI ${dash.overall_roi} 偏低，建议优化人群定向与素材后再放量。`;
  }
  return "投放数据健康，可维持当前节奏并持续 A/B 迭代。";
}

/**
 * 「投放建议」独立工作台：跨商品聚合投放实验、推广链接与创意素材，
 * 给出每商品的投放结论与可执行建议，而非跳到某个商品 tab。
 */
export default async function AdsWorkflowPage() {
  const products = await getProducts();
  const details = await Promise.all(
    products.map(async (p) => {
      const [detail, dash] = await Promise.all([getProduct(String(p.id)), getAdExperimentDashboard(String(p.id))]);
      return { product: p, detail, dash };
    }),
  );

  const totalSpend = details.reduce(
    (sum, d) => sum + (d.dash ? Number(d.dash.total_spend ?? 0) : 0),
    0,
  );
  const totalRevenue = details.reduce(
    (sum, d) => sum + (d.dash ? Number(d.dash.total_revenue ?? 0) : 0),
    0,
  );
  const overallRoi = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "—";
  const totalExperiments = details.reduce(
    (sum, d) => sum + (d.dash?.rows.length ?? 0),
    0,
  );

  // 图表数据：跨商品铺平所有实验，名称带商品前缀避免重名。
  const chartItems = details.flatMap(({ product, dash }) =>
    (dash?.rows ?? []).map((row) => ({
      name: `${product.name} · ${row.name}`,
      spend: Number(row.spend),
      revenue: Number(row.revenue),
      roi: row.roi == null ? null : Number(row.roi),
    })),
  );

  // 全场最佳实验：按 ROI 取第一名。
  const bestRow = details
    .flatMap(({ product, dash }) => (dash?.rows ?? []).map((row) => ({ product, row })))
    .filter((item) => item.row.roi != null)
    .sort((a, b) => Number(b.row.roi) - Number(a.row.roi))[0];

  const cards: AdsProductCardData[] = details.map(({ product, detail, dash }) => ({
    productId: product.id,
    name: product.name,
    platform: product.platform,
    advice: deriveAdvice(dash),
    experiments: dash?.rows ?? [],
    links: detail?.promotion_links ?? [],
    planCount: detail?.creative_plans.length ?? 0,
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 lg:px-8">
      <WorkflowHero
        eyebrow="单品运营 · 投放建议"
        title="投放建议作战室"
        description="聚合全部商品的投放实验、推广链接与创意素材，用消耗 / 收入 / ROI 三线对比给出每商品的投放结论与下一步动作。"
        icon={Megaphone}
      >
        <div className="rounded-2xl bg-white/15 px-6 py-4 text-center ring-1 ring-white/30 backdrop-blur-sm">
          <p className="text-xs tracking-widest text-orange-100">综合 ROI</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-white">{overallRoi}</p>
          <p className="mt-1.5 text-xs text-orange-100">
            消耗 ¥{totalSpend.toFixed(0)} · 收入 ¥{totalRevenue.toFixed(0)}
          </p>
        </div>
      </WorkflowHero>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="在投商品" value={String(details.length)} hint="覆盖投放数据的商品数" icon={Megaphone} />
        <KpiCard label="累计消耗" value={`¥${totalSpend.toFixed(0)}`} hint="全部实验累计花费" icon={CircleDollarSign} />
        <KpiCard
          label="综合 ROI"
          value={overallRoi}
          hint="收入 / 消耗"
          icon={TrendingUp}
          tone={Number(overallRoi) >= 3 ? "emerald" : Number(overallRoi) >= 2 ? "amber" : "rose"}
        />
        <KpiCard label="投放实验" value={String(totalExperiments)} hint="A/B 实验总数" icon={FlaskConical} tone="sky" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <SectionCard title="实验消耗 / 收入对比" icon={BarChart3} className="lg:col-span-2">
          <AdsRoiChart items={chartItems} />
        </SectionCard>

        <SectionCard title="全场最佳实验" icon={Trophy}>
          {bestRow ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-100">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                  <Flame className="h-4 w-4" aria-hidden="true" />
                  {bestRow.row.name}
                </p>
                <p className="mt-0.5 text-xs text-amber-600/80">{bestRow.product.name}</p>
                <p className="mt-3 text-3xl font-bold tabular-nums text-orange-600">
                  ROI {bestRow.row.roi}
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-xs text-slate-400">消耗</dt>
                  <dd className="font-semibold tabular-nums text-slate-700">¥{Number(bestRow.row.spend).toFixed(0)}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-xs text-slate-400">收入</dt>
                  <dd className="font-semibold tabular-nums text-slate-700">¥{Number(bestRow.row.revenue).toFixed(0)}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-xs text-slate-400">点击率</dt>
                  <dd className="font-semibold tabular-nums text-slate-700">
                    {bestRow.row.ctr ? `${(Number(bestRow.row.ctr) * 100).toFixed(2)}%` : "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-xs text-slate-400">转化率</dt>
                  <dd className="font-semibold tabular-nums text-slate-700">
                    {bestRow.row.conversion_rate ? `${(Number(bestRow.row.conversion_rate) * 100).toFixed(2)}%` : "—"}
                  </dd>
                </div>
              </dl>
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {bestRow.row.decision_reason || "表现优异，建议追加预算放量。"}
              </p>
              <Link
                href={`/products/${bestRow.product.id}?tab=ads`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 transition hover:text-orange-700"
              >
                进入该商品投放工作台 →
              </Link>
            </div>
          ) : (
            <EmptyState text="还没有测出最优实验，先跑完一轮 A/B 实验。" icon={Trophy} />
          )}
        </SectionCard>
      </div>

      <SectionCard title="逐商品投放建议" icon={Megaphone}>
        {cards.length === 0 ? (
          <EmptyState text="暂无商品投放数据" icon={Megaphone} />
        ) : (
          <AdsProductGrid items={cards} />
        )}
      </SectionCard>
    </main>
  );
}
