import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Lightbulb,
  ListChecks,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { ReviewTrendChart } from "@/components/charts/review-trend-chart";
import { ActionChecklist } from "@/components/workflows/action-checklist";
import type { ReviewActionItem } from "@/components/workflows/action-checklist";
import {
  EmptyState,
  KpiCard,
  SectionCard,
  WorkflowHero,
} from "@/components/workflows/shared";
import { getDashboardPerformanceTrend, getProduct, getProducts } from "@/lib/api";
import type { ReviewReport } from "@/types";

// 强制动态渲染：复盘数据依赖运行时商品数据，避免 build 时物化。
export const dynamic = "force-dynamic";

/**
 * 「周期复盘」独立工作台：呈现全局经营趋势，并聚合每个商品的复盘报告
 * （结论 / 洞察 / 下一步动作），而非跳到某个商品 tab。
 */
export default async function ReviewWorkflowPage() {
  const products = await getProducts();
  const trend = await getDashboardPerformanceTrend(30);
  const reports = await Promise.all(
    products.map(async (p) => {
      const detail = await getProduct(String(p.id));
      return { product: p, reports: detail?.review_reports ?? [] };
    }),
  );

  const totalReviews = reports.reduce((sum, r) => sum + r.reports.length, 0);
  const covered = reports.filter((r) => r.reports.length > 0).length;
  const latestRevenue = trend.points.length
    ? Number(trend.points[trend.points.length - 1].revenue)
    : 0;
  const totalRevenue = trend.points.reduce((sum, point) => sum + Number(point.revenue), 0);

  // 行动清单：聚合全部商品最新一轮复盘的「下一步动作」。
  const actionItems: ReviewActionItem[] = reports.flatMap(({ product, reports }) =>
    [...reports]
      .sort((a, b) => b.id - a.id)
      .slice(0, 1)
      .flatMap((report) =>
        report.next_actions.map((action, index) => ({
          key: `${product.id}-${report.id}-${index}`,
          productName: product.name,
          action,
          period: `${report.period_start.slice(0, 10)} ~ ${report.period_end.slice(0, 10)}`,
        })),
      ),
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 lg:px-8">
      <WorkflowHero
        eyebrow="单品运营 · 周期复盘"
        title="周期复盘驾驶舱"
        description="全局经营趋势一目了然，逐商品沉淀复盘结论、关键洞察与下一步动作，便于周期性回顾与执行跟踪。"
        icon={FileText}
      >
        <div className="rounded-2xl bg-white/15 px-6 py-4 text-center ring-1 ring-white/30 backdrop-blur-sm">
          <p className="text-xs tracking-widest text-orange-100">最新日收入</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-white">¥{latestRevenue.toFixed(0)}</p>
          <p className="mt-1.5 text-xs text-orange-100">近 {trend.days} 天趋势末端</p>
        </div>
      </WorkflowHero>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="已复盘商品"
          value={`${covered}/${products.length}`}
          hint="产出复盘报告的商品占比"
          icon={FileText}
        />
        <KpiCard label="复盘报告" value={String(totalReviews)} hint="累计沉淀复盘份数" icon={ClipboardList} tone="sky" />
        <KpiCard
          label="最新日收入"
          value={`¥${latestRevenue.toFixed(0)}`}
          hint={`近 ${trend.days} 天趋势末端`}
          icon={CircleDollarSign}
          tone="emerald"
        />
        <KpiCard
          label={`近 ${trend.days} 天总收入`}
          value={`¥${totalRevenue.toFixed(0)}`}
          hint="经营趋势累计"
          icon={TrendingUp}
          tone="orange"
        />
      </div>

      <SectionCard title={`近 ${trend.days} 天经营趋势`} icon={TrendingUp}>
        {trend.points.length > 0 ? (
          <ReviewTrendChart points={trend.points} />
        ) : (
          <EmptyState text="暂无趋势数据" icon={TrendingUp} />
        )}
      </SectionCard>

      <SectionCard title="本期行动清单" icon={ListChecks}>
        <p className="mb-3 text-xs text-slate-400">
          聚合各商品最新一轮复盘的「下一步动作」，逐项勾选跟踪执行进度（仅前端生效）。
        </p>
        <ActionChecklist items={actionItems} />
      </SectionCard>

      <SectionCard title="逐商品复盘记录" icon={ClipboardList}>
        {reports.length === 0 ? (
          <EmptyState text="暂无商品复盘数据" icon={FileText} />
        ) : (
          <div className="space-y-5">
            {reports.map(({ product, reports }) => (
              <ProductReviewCard
                key={product.id}
                productId={product.id}
                productName={product.name}
                reports={reports}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </main>
  );
}

/** 单商品复盘卡：头部商品信息 + 每份复盘一个带左侧色条的区块。 */
function ProductReviewCard({
  productId,
  productName,
  reports,
}: {
  productId: number;
  productName: string;
  reports: ReviewReport[];
}) {
  if (reports.length === 0) {
    return (
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{productName}</p>
          <p className="mt-0.5 text-xs text-slate-400">暂无复盘报告，录入经营数据后即可生成第一份周期复盘。</p>
        </div>
        <Link
          href={`/products/${productId}?tab=review`}
          className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
        >
          去复盘
        </Link>
      </section>
    );
  }

  const insightCount = reports.reduce((sum, report) => sum + report.insights.length, 0);
  const actionCount = reports.reduce((sum, report) => sum + report.next_actions.length, 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-sm shadow-orange-500/30">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{productName}</h3>
            <p className="text-xs text-slate-400">
              {reports.length} 份复盘 · 洞察 {insightCount} 条 · 行动项 {actionCount} 项
            </p>
          </div>
        </div>
        <Link
          href={`/products/${productId}?tab=review`}
          className="inline-flex items-center gap-1 rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
        >
          查看复盘详情
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>

      <div className="space-y-4 px-5 py-4">
        {[...reports]
          .sort((a, b) => b.id - a.id)
          .map((report) => (
            <article
              key={report.id}
              className="rounded-xl border border-slate-100 border-l-4 border-l-orange-400 bg-slate-50/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <CalendarRange className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
                  {report.period_start.slice(0, 10)} ~ {report.period_end.slice(0, 10)} 复盘
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-400 ring-1 ring-slate-200">
                  #{report.id}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{report.summary}</p>

              {report.insights.length > 0 ? (
                <div className="mt-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-sky-600">
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                    关键洞察
                  </p>
                  <ul className="space-y-1.5">
                    {report.insights.map((insight, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700"
                      >
                        <span className="mt-0.5 select-none text-sky-400">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {report.next_actions.length > 0 ? (
                <div className="mt-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-orange-600">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    下一步动作
                  </p>
                  <ul className="space-y-1.5">
                    {report.next_actions.map((action, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700"
                      >
                        <span className="mt-0.5 select-none text-orange-400">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))}
      </div>
    </section>
  );
}
