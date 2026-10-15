"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

export type CompletenessBarItem = {
  name: string;
  percent: number;
};

/** 完整度横向条形图：按商品逐条绘制，颜色随完整度分档（≥90 绿 / ≥60 橙 / 其余红）。 */
export function CompletenessBarChart({ items }: { items: CompletenessBarItem[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || items.length === 0) {
      return;
    }
    // 条形图自上而下按完整度从高到低排列，读图更顺。
    const sorted = [...items].sort((a, b) => a.percent - b.percent);
    chart.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: "{b}<br />信息完整度：{c}%",
      },
      grid: { left: 8, right: 44, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: "value", max: 100, splitLine: { lineStyle: { color: "#f1f5f9" } } },
      yAxis: {
        type: "category",
        data: sorted.map((item) => item.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisLabel: { color: "#475569", fontSize: 12 },
      },
      series: [
        {
          type: "bar",
          data: sorted.map((item) => ({
            value: item.percent,
            itemStyle: {
              color: item.percent >= 90 ? "#10b981" : item.percent >= 60 ? "#f97316" : "#f43f5e",
              borderRadius: [0, 6, 6, 0],
            },
          })),
          barWidth: 18,
          showBackground: true,
          backgroundStyle: { color: "#f8fafc", borderRadius: [0, 6, 6, 0] },
          label: { show: true, position: "right", formatter: "{c}%", color: "#334155", fontWeight: 600 },
        },
      ],
    });
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        暂无商品数据
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" style={{ height: Math.max(180, items.length * 46 + 24) }} />;
}
