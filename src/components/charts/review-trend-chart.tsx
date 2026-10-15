"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import type { DashboardPerformancePoint } from "@/types";

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

/**
 * 复盘驾驶舱专用趋势图：收入走渐变面积 + 点击 / 转化双折线（右轴）。
 * 与看板页共用的 PerformanceTrendChart 相互独立，避免改坏看板。
 */
export function ReviewTrendChart({ points }: { points: DashboardPerformancePoint[] }) {
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
    if (!chart) {
      return;
    }
    const labels = points.map((point) => point.period_start);
    chart.setOption({
      tooltip: { trigger: "axis" },
      legend: { data: ["收入(元)", "点击", "转化"], top: 0, textStyle: { color: "#475569", fontSize: 12 } },
      grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },
      xAxis: {
        type: "category",
        data: labels,
        boundaryGap: false,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
        axisLabel: { color: "#64748b", fontSize: 11 },
      },
      yAxis: [
        {
          type: "value",
          name: "收入(元)",
          splitLine: { lineStyle: { color: "#f1f5f9" } },
          axisLabel: { color: "#64748b", fontSize: 11 },
        },
        { type: "value", name: "次数", splitLine: { show: false }, axisLabel: { color: "#64748b", fontSize: 11 } },
      ],
      series: [
        {
          name: "收入(元)",
          type: "line",
          smooth: true,
          data: points.map((point) => Number(point.revenue)),
          itemStyle: { color: "#f97316" },
          lineStyle: { width: 3 },
          symbolSize: 6,
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(249,115,22,0.28)" },
                { offset: 1, color: "rgba(249,115,22,0.02)" },
              ],
            },
          },
        },
        {
          name: "点击",
          type: "line",
          smooth: true,
          yAxisIndex: 1,
          data: points.map((point) => point.clicks),
          itemStyle: { color: "#0ea5e9" },
          lineStyle: { width: 2 },
          symbolSize: 5,
        },
        {
          name: "转化",
          type: "line",
          smooth: true,
          yAxisIndex: 1,
          data: points.map((point) => point.conversions),
          itemStyle: { color: "#10b981" },
          lineStyle: { width: 2 },
          symbolSize: 5,
        },
      ],
    });
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-slate-400">
        暂无趋势数据
      </div>
    );
  }

  return <div ref={containerRef} className="h-80 w-full" />;
}
