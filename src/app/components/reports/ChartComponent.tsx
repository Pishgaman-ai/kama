"use client";

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieLabelRenderProps,
} from "recharts";

interface ChartData {
  name: string;
  [key: string]: string | number;
}

interface ChartComponentProps {
  type: "bar" | "line" | "pie" | "radar";
  data: ChartData[];
  dataKey: string;
  nameKey?: string;
  xAxisKey?: string;
  yAxisLabel?: string;
  title?: string;
  height?: number;
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  type,
  data,
  dataKey,
  nameKey = "name",
  xAxisKey = "name",
  yAxisLabel = "",
  title = "",
  height = 300,
}) => {
  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis
              domain={[0, 20]}
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill="#8884d8" name={title} />
          </BarChart>
        );

      case "line":
        return (
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis
              domain={[0, 20]}
              label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              name={title}
            />
          </LineChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={(props: PieLabelRenderProps) => {
                const { name, percent } = props;
                if (typeof name === "string" && typeof percent === "number") {
                  return `${name} ${(percent * 100).toFixed(0)}%`;
                }
                return "";
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
            />
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case "radar":
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={xAxisKey} />
            <PolarRadiusAxis />
            <Radar
              name={title}
              dataKey={dataKey}
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Tooltip />
            <Legend />
          </RadarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartComponent;
