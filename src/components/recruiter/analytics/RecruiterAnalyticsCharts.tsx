import React from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DataRow = Record<string, string | number | undefined>;

interface ChartShellProps {
  title: string;
  subtitle?: string;
  height?: number;
  children: React.ReactNode;
}

const CHART_PALETTE = ['#0066FF', '#10B981', '#7C3AED', '#F59E0B', '#06B6D4', '#EF4444', '#9333EA', '#0EA5E9', '#84CC16', '#E11D48'];

const ChartShell: React.FC<ChartShellProps> = ({ title, subtitle, height = 300, children }) => (
  <Card sx={{ borderRadius: 2.5, border: '1px solid rgba(148, 163, 184, 0.2)', height: '100%' }}>
    <CardContent sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ width: '100%', height }}>
        {children}
      </Box>
    </CardContent>
  </Card>
);

interface TrendChartProps {
  title: string;
  subtitle?: string;
  data: DataRow[];
  xKey: string;
  lines: Array<{ key: string; label: string; color?: string }>;
  area?: boolean;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ title, subtitle, data, xKey, lines, area = false, height = 320 }) => {
  const theme = useTheme();

  return (
    <ChartShell title={title} subtitle={subtitle} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        {area ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
            <XAxis dataKey={xKey} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
            <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {lines.map((line, idx) => (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color || CHART_PALETTE[idx % CHART_PALETTE.length]}
                fill={line.color || CHART_PALETTE[idx % CHART_PALETTE.length]}
                fillOpacity={0.16}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
            <XAxis dataKey={xKey} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
            <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {lines.map((line, idx) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color || CHART_PALETTE[idx % CHART_PALETTE.length]}
                strokeWidth={2.5}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </ChartShell>
  );
};

interface SimpleBarChartProps {
  title: string;
  subtitle?: string;
  data: DataRow[];
  xKey: string;
  barKey: string;
  barLabel?: string;
  color?: string;
  height?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  title,
  subtitle,
  data,
  xKey,
  barKey,
  barLabel,
  color = '#0066FF',
  height = 320,
}) => {
  const theme = useTheme();

  return (
    <ChartShell title={title} subtitle={subtitle} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
          <XAxis dataKey={xKey} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
          <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey={barKey} name={barLabel || barKey} fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
};

interface MultiBarChartProps {
  title: string;
  subtitle?: string;
  data: DataRow[];
  xKey: string;
  bars: Array<{ key: string; label: string; color?: string }>;
  height?: number;
}

export const MultiBarChart: React.FC<MultiBarChartProps> = ({ title, subtitle, data, xKey, bars, height = 320 }) => {
  const theme = useTheme();

  return (
    <ChartShell title={title} subtitle={subtitle} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.24)" />
          <XAxis dataKey={xKey} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
          <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {bars.map((bar, idx) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.label}
              fill={bar.color || CHART_PALETTE[idx % CHART_PALETTE.length]}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
};

interface PieDistributionChartProps {
  title: string;
  subtitle?: string;
  data: Array<{ label: string; value: number }>;
  height?: number;
}

export const PieDistributionChart: React.FC<PieDistributionChartProps> = ({ title, subtitle, data, height = 320 }) => (
  <ChartShell title={title} subtitle={subtitle} height={height}>
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip />
        <Legend />
        <Pie data={data} dataKey="value" nameKey="label" outerRadius={100} innerRadius={42}>
          {data.map((entry, idx) => (
            <Cell key={`${entry.label}-${idx}`} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  </ChartShell>
);

interface FunnelBreakdownChartProps {
  title: string;
  subtitle?: string;
  data: Array<{ stage: string; count: number }>;
  height?: number;
}

export const FunnelBreakdownChart: React.FC<FunnelBreakdownChartProps> = ({ title, subtitle, data, height = 350 }) => (
  <ChartShell title={title} subtitle={subtitle} height={height}>
    <ResponsiveContainer width="100%" height="100%">
      <FunnelChart>
        <Tooltip />
        <Funnel dataKey="count" data={data} isAnimationActive>
          <LabelList position="right" fill="#111827" stroke="none" dataKey="stage" />
          {data.map((entry, idx) => (
            <Cell key={`${entry.stage}-${idx}`} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  </ChartShell>
);

interface HeatmapActivityChartProps {
  title: string;
  subtitle?: string;
  data: Array<{ date: string; applications: number; interviews: number; offers: number; hires: number }>;
  metric?: 'applications' | 'interviews' | 'offers' | 'hires';
}

export const HeatmapActivityChart: React.FC<HeatmapActivityChartProps> = ({
  title,
  subtitle,
  data,
  metric = 'applications',
}) => {
  const maxValue = data.reduce((max, row) => Math.max(max, Number(row[metric] || 0)), 0) || 1;

  return (
    <ChartShell title={title} subtitle={subtitle} height={250}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(24px, 1fr))',
          gap: 0.75,
          alignItems: 'center',
          pt: 0.5,
        }}
      >
        {data.map((item) => {
          const value = Number(item[metric] || 0);
          const intensity = value / maxValue;
          const alpha = Math.max(0.12, Math.min(0.95, intensity));
          return (
            <Box
              key={`${item.date}-${metric}`}
              title={`${item.date} - ${metric}: ${value}`}
              sx={{
                width: '100%',
                minHeight: 20,
                borderRadius: 0.7,
                bgcolor: `rgba(0,102,255,${alpha})`,
                border: '1px solid rgba(148,163,184,0.2)',
              }}
            />
          );
        })}
      </Box>
    </ChartShell>
  );
};
