"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

export type AdsRoiChartItem = {
  name: string;
  spend: number;
  revenue: number;
  roi: number | null;
};

/** 投放消耗 / 收入对比图：每实验一组柱 + ROI 折线（右轴），一眼看出谁在赚钱。 */
export function AdsRoiChart({ items }: { items: AdsRoiChartItem[] }) {
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
    chart.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      legend: { data: ["消耗(元)", "收入(元)", "ROI"], top: 0, textStyle: { color: "#475569", fontSize: 12 } },
      grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },
      xAxis: {
        type: "category",
        data: items.map((item) => item.name),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisLabel: { color: "#475569", fontSize: 11, interval: 0, rotate: items.length > 4 ? 24 : 0 },
      },
      yAxis: [
        { type: "value", name: "金额(元)", splitLine: { lineStyle: { color: "#f1f5f9" } } },
        { type: "value", name: "ROI", splitLine: { show: false }, min: 0 },
      ],
      series: [
        {
          name: "消耗(元)",
          type: "bar",
          data: items.map((item) => item.spend),
          itemStyle: { color: "#fb923c", borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 26,
        },
        {
          name: "收入(元)",
          type: "bar",
          data: items.map((item) => item.revenue),
          itemStyle: { color: "#10b981", borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 26,
        },
        {
          name: "ROI",
          type: "line",
          yAxisIndex: 1,
          data: items.map((item) => item.roi),
          itemStyle: { color: "#e11d48" },
          lineStyle: { width: 2.5 },
          symbolSize: 8,
          label: { show: true, color: "#e11d48", fontWeight: 600 },
        },
      ],
    });
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-slate-400">
        暂无投放实验数据，可先在商品详情「投放」标签创建 A/B 实验。
      </div>
    );
  }

  return <div ref={containerRef} className="h-72 w-full" />;
}
