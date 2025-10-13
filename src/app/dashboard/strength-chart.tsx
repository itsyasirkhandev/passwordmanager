"use client"

import * as React from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

type StrengthChartProps = {
  data: { name: string, value: number, fill: string }[];
}

export function StrengthChart({ data }: StrengthChartProps) {
  const chartConfig = {
    value: {
      label: "Passwords",
    },
    ...data.reduce((acc, item) => {
        acc[item.name] = {
            label: item.name,
            color: item.fill,
        };
        return acc;
    }, {} as any)
  }

  return (
     <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
          dy={-4}
          width={80}
        />
        <XAxis dataKey="value" type="number" hide />
        <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={4} layout="vertical" />
      </BarChart>
    </ChartContainer>
  )
}
