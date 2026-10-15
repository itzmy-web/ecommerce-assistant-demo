import type { ComponentType, ReactNode } from "react";

import { platformLabels } from "@/lib/platform-labels";

export { platformLabels };

/** 页面顶部渐变横幅：三张工作流页共用，右侧 children 可放大数字 / 环形进度等焦点信息。 */
export function WorkflowHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-500 to-red-500 p-6 text-white shadow-lg shadow-orange-500/20">
      {/* 装饰光斑：纯视觉，不拦截点击 */}
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-red-400/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-orange-100">
            <Icon className="h-4 w-4" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-orange-50/90">{description}</p>
        </div>
        {children ? <div className="shrink-0">{children}</div> : null}
      </div>
    </section>
  );
}

const kpiTones = {
  orange: "bg-orange-50 text-orange-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
} as const;

const kpiValueTones = {
  orange: "text-orange-600",
  emerald: "text-emerald-600",
  rose: "text-rose-600",
  amber: "text-amber-600",
  sky: "text-sky-600",
  slate: "text-slate-900",
} as const;

export type KpiTone = keyof typeof kpiTones;

/** 指标卡：图标 + 大数字 + 说明，三张工作流页的 KPI 行统一走这里。 */
export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "orange",
}: {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  tone?: KpiTone;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${kpiTones[tone]}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
      <p className={`mt-3 text-2xl font-bold tabular-nums ${kpiValueTones[tone]}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

/** 统一卡片外壳：标题 + 图标 + 右侧操作区，保证三页信息分区风格一致。 */
export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          {Icon ? <Icon className="h-4.5 w-4.5 text-orange-500" aria-hidden="true" /> : null}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** 空态：统一文案与插槽位，避免各页空表格裸奔。 */
export function EmptyState({ text, icon: Icon }: { text: string; icon?: ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-sm text-slate-400">
      {Icon ? <Icon className="h-8 w-8 text-slate-300" aria-hidden="true" /> : null}
      {text}
    </div>
  );
}

/** 完整度环形进度：SVG 绘制，percent 0-100。 */
export function CompletenessRing({
  percent,
  size = 96,
  stroke = 8,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const tone = percent >= 90 ? "#10b981" : percent >= 60 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-white">{percent}%</span>
        <span className="text-[10px] tracking-widest text-orange-100">完整度</span>
      </div>
    </div>
  );
}

/** 横向小条：字段缺失计数等轻量可视化，纯 CSS 不引图表库。 */
export function MiniBar({
  value,
  max,
  tone = "orange",
}: {
  value: number;
  max: number;
  tone?: "orange" | "rose" | "emerald" | "sky" | "amber";
}) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  const bg = {
    orange: "bg-orange-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
  }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${bg}`} style={{ width: `${width}%` }} />
    </div>
  );
}
