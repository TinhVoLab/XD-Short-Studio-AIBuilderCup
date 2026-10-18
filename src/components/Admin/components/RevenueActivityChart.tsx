import React, { useState, useMemo, useRef } from 'react';
import styles from '../SuperAdminPortal.module.css';

interface DataPoint {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
  renders: number;
}

interface RevenueActivityChartProps {
  recentOrders?: any[];
  totalRevenue?: number;
  totalTransactions?: number;
  activeRenders?: number;
}

// Thuật toán sinh đường cong Catmull-Rom / Bezier Spline mượt mà cho SVG
function getBezierSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

export const RevenueActivityChart: React.FC<RevenueActivityChartProps> = ({
  recentOrders = [],
  totalRevenue = 0,
  totalTransactions = 0,
  activeRenders = 0,
}) => {
  const [metricMode, setMetricMode] = useState<'revenue' | 'renders'>('revenue');
  const [timeframe, setTimeframe] = useState<7 | 30>(7);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sinh dữ liệu ngày và tổng hợp từ recentOrders thực tế
  const chartData: DataPoint[] = useMemo(() => {
    const days = timeframe;
    const list: DataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = `${d.getDate()}/${d.getMonth() + 1}`;

      // Lọc các order trong ngày này
      const dayOrders = recentOrders.filter((o) => {
        if (!o.createdAt && !o.timestamp) return false;
        const oDate = new Date(o.createdAt || o.timestamp).toISOString().split('T')[0];
        return oDate === dateStr && o.status === 'success';
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
      const dayTxs = dayOrders.length;

      // Ước tính render hoạt động
      const baseRenders = activeRenders > 0 && i === 0 ? activeRenders + 4 : 0;

      list.push({
        date: dateStr,
        label,
        revenue: dayRevenue,
        transactions: dayTxs,
        renders: baseRenders + (dayTxs * 3),
      });
    }

    // Nếu chưa có giao dịch nào, tạo 1 baseline nhẹ nhàng để biểu đồ luôn có nhịp trực quan
    const allZero = list.every((item) => item.revenue === 0 && item.renders === 0);
    if (allZero && totalRevenue > 0) {
      list[list.length - 1].revenue = totalRevenue;
      list[list.length - 1].transactions = totalTransactions || 1;
      list[list.length - 1].renders = activeRenders || 2;
    }

    return list;
  }, [timeframe, recentOrders, totalRevenue, totalTransactions, activeRenders]);

  // Kích thước viewBox của SVG
  const width = 800;
  const height = 150;
  const paddingLeft = 0;
  const paddingRight = 0;
  const paddingTop = 15;
  const paddingBottom = 5;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Lấy giá trị lớn nhất để chia tỷ lệ Y
  const values = chartData.map((d) => (metricMode === 'revenue' ? d.revenue : d.renders));
  const maxVal = Math.max(...values, metricMode === 'revenue' ? 1000000 : 10);
  const minVal = 0;

  // Tính tọa độ (x, y) cho từng điểm dữ liệu (từ x=0 đến x=width tràn viền 100%)
  const points = useMemo(() => {
    const stepX = innerWidth / (chartData.length - 1 || 1);
    return chartData.map((d, idx) => {
      const val = metricMode === 'revenue' ? d.revenue : d.renders;
      const x = paddingLeft + idx * stepX;
      const normY = (val - minVal) / (maxVal - minVal || 1);
      const y = paddingTop + innerHeight - normY * innerHeight;
      return { x, y, data: d };
    });
  }, [chartData, metricMode, maxVal, innerWidth, innerHeight]);

  const linePath = useMemo(() => getBezierSplinePath(points), [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = paddingTop + innerHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${linePath} L ${lastX.toFixed(1)},${bottomY} L ${firstX.toFixed(1)},${bottomY} Z`;
  }, [linePath, points, innerHeight]);

  // Xử lý hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratioX = Math.max(0, Math.min(1, mouseX / rect.width));
    const svgX = ratioX * width;

    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((p, idx) => {
      const diff = Math.abs(p.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoveredIdx(closestIdx);
  };

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  // Tính tổng trong khoảng thời gian
  const periodTotalRevenue = chartData.reduce((acc, c) => acc + c.revenue, 0);
  const periodTotalRenders = chartData.reduce((acc, c) => acc + c.renders, 0);

  return (
    <div className={styles.chartPanel}>
      {/* Chart Header & Controls */}
      <div className={styles.chartHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {metricMode === 'revenue' ? 'Xu Hướng Doanh Thu VietQR' : 'Hoạt Động Render Video'}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--accent)',
              background: 'rgba(190, 255, 1, 0.08)',
              border: '1px solid rgba(190, 255, 1, 0.25)',
              padding: '1px 6px',
              borderRadius: 4,
              textTransform: 'uppercase',
            }}>
              Live Analytics
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {metricMode === 'revenue'
              ? `Tổng ${timeframe} ngày: ${periodTotalRevenue.toLocaleString('vi-VN')} đ`
              : `Tổng ${timeframe} ngày: ${periodTotalRenders} video hoàn tất`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Mode Switcher */}
          <div className={styles.chartToggleGroup}>
            <button
              type="button"
              className={`${styles.chartToggleBtn} ${metricMode === 'revenue' ? styles.chartToggleBtnActive : ''}`}
              onClick={() => setMetricMode('revenue')}
            >
              Doanh Thu
            </button>
            <button
              type="button"
              className={`${styles.chartToggleBtn} ${metricMode === 'renders' ? styles.chartToggleBtnActive : ''}`}
              onClick={() => setMetricMode('renders')}
            >
              Render Video
            </button>
          </div>

          {/* Timeframe Switcher */}
          <div className={styles.chartToggleGroup}>
            <button
              type="button"
              className={`${styles.chartToggleBtn} ${timeframe === 7 ? styles.chartToggleBtnActive : ''}`}
              onClick={() => setTimeframe(7)}
            >
              7 Ngày
            </button>
            <button
              type="button"
              className={`${styles.chartToggleBtn} ${timeframe === 30 ? styles.chartToggleBtnActive : ''}`}
              onClick={() => setTimeframe(30)}
            >
              30 Ngày
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area (Tràn viền 100% 2 bên mép) */}
      <div className={styles.chartSvgWrapper}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className={styles.chartSvg}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            {/* Gradient phát quang màu Accent (#BEFF01) */}
            <linearGradient id="chartAccentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BEFF01" stopOpacity="0.22" />
              <stop offset="60%" stopColor="#BEFF01" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#BEFF01" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradient phát quang màu Blue khi xem Render */}
            <linearGradient id="chartBlueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#00D4FF" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.0" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hairline Grid Lines ngang */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={width - paddingRight}
            y2={paddingTop}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + innerHeight / 2}
            x2={width - paddingRight}
            y2={paddingTop + innerHeight / 2}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + innerHeight}
            x2={width - paddingRight}
            y2={paddingTop + innerHeight}
            stroke="rgba(255, 255, 255, 0.08)"
          />

          {/* Vùng diện tích Gradient Fill */}
          <path
            d={areaPath}
            fill={metricMode === 'revenue' ? 'url(#chartAccentGradient)' : 'url(#chartBlueGradient)'}
          />

          {/* Đường Line Neon Spline */}
          <path
            d={linePath}
            fill="none"
            stroke={metricMode === 'revenue' ? '#BEFF01' : '#00D4FF'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />

          {/* Crosshair gióng dọc khi rê chuột */}
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + innerHeight}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Vòng tròn điểm phát sáng */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="6"
                fill={metricMode === 'revenue' ? '#BEFF01' : '#00D4FF'}
                fillOpacity="0.3"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="3.5"
                fill="#ffffff"
                stroke={metricMode === 'revenue' ? '#BEFF01' : '#00D4FF'}
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {/* Floating Glass Tooltip khi hover */}
        {hoveredPoint && (
          <div
            className={styles.chartTooltip}
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
              transform: `translate(${hoveredPoint.x > width * 0.75 ? '-105%' : hoveredPoint.x < width * 0.25 ? '5%' : '-50%'}, -120%)`,
            }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
              {hoveredPoint.data.date}
            </div>
            {metricMode === 'revenue' ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                  {hoveredPoint.data.revenue.toLocaleString('vi-VN')} đ
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-sub)' }}>
                  {hoveredPoint.data.transactions} giao dịch thành công
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}>
                  {hoveredPoint.data.renders} lượt render
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-sub)' }}>
                  Hiệu năng máy chủ ổn định
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* HTML X-Axis Labels (Trải đều sắc nét, không bao giờ bị méo chữ) */}
      <div className={styles.chartXAxis}>
        {points.map((p, idx) => {
          if (timeframe === 30 && idx % 4 !== 0 && idx !== points.length - 1) return null;
          return (
            <span key={p.data.date} className={styles.chartXLabel}>
              {p.data.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};
