import React from 'react'
import styles from '../Tabs.module.css'
import cfStyles from './CyberFlowInspector.module.css'
import { InspectorProps, ColorDot, Slider } from './common'
import { LandingFxControl } from './shared'

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (c: string) => void;
  sm?: boolean;
}

const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange, sm = true }) => (
  <div className={cfStyles.colorField}>
    <span className={cfStyles.colorFieldLabel}>{label}</span>
    <ColorDot value={value} onChange={onChange} sm={sm} />
  </div>
)

interface InspectorHeaderProps {
  icon: React.ReactNode;
  title: string;
  badge: string;
  color: string;
}

const SVGIcons = {
  orbit: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  signal: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V4" />
    </svg>
  ),
  matrix: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  gauge: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 14v-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  ),
  liquid: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  ai: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9z" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  ),
  hologram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  timeline: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  lifecycle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
};

const InspectorHeader: React.FC<InspectorHeaderProps> = ({ icon, title, badge, color }) => (
  <div className={cfStyles.inspectorHeader}>
    <div className={cfStyles.inspectorHeaderLeft} style={{ color }}>
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      <span>{title}</span>
    </div>
    <span
      className={cfStyles.inspectorBadge}
      style={{ background: `${color}18`, color, border: `1px solid ${color}33` }}
    >
      {badge}
    </span>
  </div>
)

export function CyberFlowInspector({ element, updateElement }: InspectorProps) {
  const type = element.type
  let content: React.ReactNode = null;

  // 🪐 1. ORBIT SYSTEM
  if (type === 'orbit-system') {
    const data = element.orbitData || {
      centerLabel: 'TỔNG DOANH THU',
      centerValue: '₫2.8B',
      accentColor: '#00D4FF',
      planets: [
        { label: 'Q1', value: '₫680M', color: '#00D4FF', speed: 0.8 },
        { label: 'Q2', value: '₫850M', color: '#BEFF01', speed: 0.55 },
        { label: 'Q3', value: '₫720M', color: '#FF2D78', speed: 0.35 },
      ],
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { orbitData: { ...data, ...patch } })
    }

    content = (
      <div className={cfStyles.cyberCard} style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.03)' }}>
        <InspectorHeader icon={SVGIcons.orbit} title="Hệ Thống Quỹ Đạo" badge="ORBIT" color="#00D4FF" />

        <div className={cfStyles.mb8}>
          <span className={cfStyles.sectionLabel}>Số liệu trung tâm</span>
          <div className={cfStyles.grid2}>
            <input
              className={styles.input}
              value={data.centerValue || ''}
              onChange={e => updateData({ centerValue: e.target.value })}
              placeholder="VD: ₫2.8B"
              style={{ marginBottom: 0 }}
            />
            <input
              className={styles.input}
              value={data.centerLabel || ''}
              onChange={e => updateData({ centerLabel: e.target.value })}
              placeholder="VD: DOANH THU"
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        <div className={cfStyles.mb10}>
          <ColorField label="Màu trung tâm" value={data.accentColor || '#00D4FF'} onChange={c => updateData({ accentColor: c })} />
        </div>

        <div className={cfStyles.sectionLabelMuted}>Các hành tinh ({data.planets.length}):</div>
        {data.planets.map((p, idx) => (
          <div key={idx} className={cfStyles.grid3Del}>
            <input
              className={styles.input}
              value={p.label}
              onChange={e => {
                const next = [...data.planets]
                next[idx] = { ...next[idx], label: e.target.value }
                updateData({ planets: next })
              }}
              placeholder="Tên"
              style={{ marginBottom: 0 }}
            />
            <input
              className={styles.input}
              value={p.value}
              onChange={e => {
                const next = [...data.planets]
                next[idx] = { ...next[idx], value: e.target.value }
                updateData({ planets: next })
              }}
              placeholder="Giá trị"
              style={{ marginBottom: 0 }}
            />
            <div className={cfStyles.colorDotCenter}>
              <ColorDot
                value={p.color || '#00D4FF'}
                onChange={c => {
                  const next = [...data.planets]
                  next[idx] = { ...next[idx], color: c }
                  updateData({ planets: next })
                }}
                sm
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 📡 2. SIGNAL WAVE
  if (type === 'signal-wave') {
    const data = element.signalWaveData || {
      title: 'SIGNAL MONITOR',
      badge: 'LIVE',
      waveColor: '#00D4FF',
      points: [
        { label: 'T1', value: 25 },
        { label: 'T2', value: 55 },
        { label: 'T3', value: 40 },
        { label: 'T4', value: 80 },
        { label: 'T5', value: 60 },
        { label: 'T6', value: 90 },
        { label: 'T7', value: 70, highlight: true },
      ],
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { signalWaveData: { ...data, ...patch } })
    }

    content = (
      <div className={cfStyles.cyberCard} style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.03)' }}>
        <InspectorHeader icon={SVGIcons.signal} title="Sóng Tín Hiệu Live" badge="SIGNAL" color="#00D4FF" />

        <div className={cfStyles.gridTitleBadge}>
          <div>
            <span className={cfStyles.sectionLabel}>Tiêu đề</span>
            <input
              className={styles.input}
              value={data.title || ''}
              onChange={e => updateData({ title: e.target.value })}
              placeholder="Tiêu đề"
              style={{ marginBottom: 0 }}
            />
          </div>
          <div>
            <span className={cfStyles.sectionLabel}>Badge</span>
            <input
              className={styles.input}
              value={data.badge || ''}
              onChange={e => updateData({ badge: e.target.value })}
              placeholder="LIVE"
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        <div className={cfStyles.mb4}>
          <ColorField label="Màu sóng Neon" value={data.waveColor || '#00D4FF'} onChange={c => updateData({ waveColor: c })} />
        </div>
      </div>
    )
  }

  // 🔲 3. CYBER MATRIX
  if (type === 'cyber-matrix') {
    const data = element.cyberMatrixData || {
      title: 'DATA MATRIX',
      rows: 5,
      cols: 8,
      baseColor: '#00D4FF',
      cells: [],
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { cyberMatrixData: { ...data, ...patch } })
    }

    content = (
      <div className={cfStyles.cyberCard} style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.03)' }}>
        <InspectorHeader icon={SVGIcons.matrix} title="Ma Trận Dữ Liệu" badge="MATRIX" color="#00D4FF" />

        <div className={cfStyles.mb8}>
          <span className={cfStyles.sectionLabel}>Tiêu đề</span>
          <input
            className={styles.input}
            value={data.title || ''}
            onChange={e => updateData({ title: e.target.value })}
            placeholder="DATA MATRIX"
            style={{ marginBottom: 0 }}
          />
        </div>

        <div className={cfStyles.mb4}>
          <ColorField label="Màu ma trận" value={data.baseColor || '#00D4FF'} onChange={c => updateData({ baseColor: c })} />
        </div>
      </div>
    )
  }

  // 🏎️ 4. SPEED METER
  if (type === 'speed-meter') {
    const data = element.speedMeterData || {
      label: 'HIỆU SUẤT',
      value: 78,
      unit: '%',
      needleColor: '#FF2D78',
      accentColor: '#BEFF01',
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { speedMeterData: { ...data, ...patch } })
    }

    content = (
      <div className={cfStyles.cyberCard} style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.03)' }}>
        <InspectorHeader icon={SVGIcons.gauge} title="Đồng Hồ Tốc Kế" badge="GAUGE" color="#FF2D78" />

        <div className={cfStyles.mb8}>
          <span className={cfStyles.sectionLabel}>Nhãn chỉ số</span>
          <input
            className={styles.input}
            value={data.label || ''}
            onChange={e => updateData({ label: e.target.value })}
            placeholder="VD: HIỆU SUẤT, TỐC ĐỘ..."
            style={{ marginBottom: 0 }}
          />
        </div>

        <div className={cfStyles.mb8}>
          <Slider
            label="Giá trị đo"
            value={data.value !== undefined ? data.value : 78}
            min={0}
            max={100}
            step={1}
            display={v => `${v}${data.unit || '%'}`}
            onChange={v => updateData({ value: v })}
          />
        </div>

        <div className={cfStyles.grid2mb4}>
          <ColorField label="Kim chỉ" value={data.needleColor || '#FF2D78'} onChange={c => updateData({ needleColor: c })} />
          <ColorField label="Điểm nhấn" value={data.accentColor || '#BEFF01'} onChange={c => updateData({ accentColor: c })} />
        </div>

        <div style={{ marginTop: 'var(--space-2)' }}>
          <LandingFxControl element={element} updateElement={updateElement} />
        </div>
      </div>
    )
  }

  // 🌊 5. LIQUID FILL
  if (type === 'liquid-fill') {
    const data = element.liquidFillData || {
      label: 'NĂNG LƯỢNG',
      value: 68,
      unit: '%',
      subLabel: '8.4 / 12.0 kWh',
      liquidColor: '#00D4FF',
      accentColor: '#BEFF01',
      shape: 'circle',
      waveSpeed: 1.5,
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { liquidFillData: { ...data, ...patch } })
    }

    content = (
      <div className={cfStyles.cyberCard} style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.03)' }}>
        <InspectorHeader icon={SVGIcons.liquid} title="Bình Chất Lỏng Neon" badge="LIQUID" color="#00D4FF" />

        <div className={cfStyles.grid2}>
          <div>
            <span className={cfStyles.sectionLabel}>Nhãn</span>
            <input
              className={styles.input}
              value={data.label || ''}
              onChange={e => updateData({ label: e.target.value })}
              placeholder="NĂNG LƯỢNG"
              style={{ marginBottom: 0 }}
            />
          </div>
          <div>
            <span className={cfStyles.sectionLabel}>Chi tiết</span>
            <input
              className={styles.input}
              value={data.subLabel || ''}
              onChange={e => updateData({ subLabel: e.target.value })}
              placeholder="8.4 kWh"
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        <div className={cfStyles.mb6}>
          <Slider
            label="Mức chất lỏng"
            value={data.value !== undefined ? data.value : 68}
            min={0}
            max={100}
            step={1}
            display={v => `${v}${data.unit || '%'}`}
            onChange={v => updateData({ value: v })}
          />
        </div>

        <div className={cfStyles.mb8}>
          <Slider
            label="Tốc độ sóng"
            value={data.waveSpeed || 1.5}
            min={0.5}
            max={3}
            step={0.1}
            display={v => `${v.toFixed(1)}x`}
            onChange={v => updateData({ waveSpeed: v })}
          />
        </div>

        <div className={cfStyles.grid2mb4}>
          <ColorField label="Chất lỏng" value={data.liquidColor || '#00D4FF'} onChange={c => updateData({ liquidColor: c })} />
          <ColorField label="Điểm nhấn" value={data.accentColor || '#BEFF01'} onChange={c => updateData({ accentColor: c })} />
        </div>
      </div>
    )
  }

  // 🧠 6. NEURON NETWORK
  if (type === 'neuron-network') {
    const data = element.neuronNetworkData || {
      title: 'NEURAL AI CLUSTER',
      status: 'ACTIVE 99.4%',
      coreColor: '#00FF88',
      synapseColor: '#00D4FF',
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { neuronNetworkData: { ...data, ...patch } })
    }

    content = (
      <div className={cfStyles.cyberCard} style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.03)' }}>
        <InspectorHeader icon={SVGIcons.ai} title="Mạng Nơ-ron AI" badge="AI CORE" color="#00FF88" />

        <div className={cfStyles.grid2}>
          <div>
            <span className={cfStyles.sectionLabel}>Tên cụm AI</span>
            <input
              className={styles.input}
              value={data.title || ''}
              onChange={e => updateData({ title: e.target.value })}
              placeholder="NEURAL CLUSTER"
              style={{ marginBottom: 0 }}
            />
          </div>
          <div>
            <span className={cfStyles.sectionLabel}>Trạng thái</span>
            <input
              className={styles.input}
              value={data.status || ''}
              onChange={e => updateData({ status: e.target.value })}
              placeholder="ACTIVE 99.4%"
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        <div className={cfStyles.grid2mb4}>
          <ColorField label="Lõi Core" value={data.coreColor || '#00FF88'} onChange={c => updateData({ coreColor: c })} />
          <ColorField label="Synapse" value={data.synapseColor || '#00D4FF'} onChange={c => updateData({ synapseColor: c })} />
        </div>
      </div>
    )
  }

  // ⚡ 7. HOLOGRAM BAR
  if (type === 'hologram-bar') {
    const data = element.hologramBarData || {
      title: 'HỆ THỐNG XUNG LỰC',
      accentColor: '#BEFF01',
      showScanline: true,
      bars: [
        { label: 'GPU CLUSTER', value: 85, color: '#00D4FF', sub: '92 TFLOPS' },
        { label: 'NEURAL CHIP', value: 92, color: '#BEFF01', sub: '128 TOPS' },
        { label: 'QUANTUM BUS', value: 64, color: '#FF2D78', sub: '4.8 GB/s' },
      ]
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { hologramBarData: { ...data, ...patch } })
    }

    content = (
      <div className={cfStyles.cyberCard} style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.03)' }}>
        <InspectorHeader icon={SVGIcons.hologram} title="Cột Năng Lượng 3D" badge="HOLOGRAM" color="#BEFF01" />

        <div className={cfStyles.mb8}>
          <span className={cfStyles.sectionLabel}>Tiêu đề</span>
          <input
            className={styles.input}
            value={data.title || ''}
            onChange={e => updateData({ title: e.target.value })}
            placeholder="HỆ THỐNG XUNG LỰC"
            style={{ marginBottom: 0 }}
          />
        </div>

        <div className={cfStyles.mb10}>
          <ColorField label="Màu điểm nhấn" value={data.accentColor || '#BEFF01'} onChange={c => updateData({ accentColor: c })} />
        </div>

        <div className={cfStyles.sectionLabelMuted}>Danh sách cột 3D ({data.bars.length}):</div>
        {data.bars.map((b, idx) => (
          <div key={idx} className={cfStyles.gridBarItem}>
            <input
              className={styles.input}
              value={b.label}
              onChange={e => {
                const next = [...data.bars]
                next[idx] = { ...next[idx], label: e.target.value }
                updateData({ bars: next })
              }}
              placeholder="Tên cột"
              style={{ marginBottom: 0 }}
            />
            <input
              type="number"
              className={styles.input}
              value={b.value}
              onChange={e => {
                const next = [...data.bars]
                next[idx] = { ...next[idx], value: Number(e.target.value) || 0 }
                updateData({ bars: next })
              }}
              placeholder="%"
              style={{ marginBottom: 0 }}
            />
            <div className={cfStyles.colorDotCenter}>
              <ColorDot
                value={b.color || '#00D4FF'}
                onChange={c => {
                  const next = [...data.bars]
                  next[idx] = { ...next[idx], color: c }
                  updateData({ bars: next })
                }}
                sm
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 📈 8. TIMELINE PULSE
  if (type === 'timeline-pulse') {
    const data = element.timelinePulseData || {
      title: 'LỘ TRÌNH ĐỘT PHÁ',
      pulseColor: '#00D4FF',
      accentColor: '#BEFF01',
      milestones: [
        { time: '09:00', title: 'Khởi động', desc: 'Khởi chạy Core', status: 'completed', color: '#00FF88' },
        { time: '12:30', title: 'Mở rộng', desc: '10,000 Nodes', status: 'completed', color: '#00D4FF' },
        { time: '16:00', title: 'Tối ưu', desc: 'AI Sync Live', status: 'active', color: '#BEFF01' },
        { time: '21:00', title: 'Đỉnh cao', desc: 'Release v2.0', status: 'pending', color: '#FF2D78' },
      ]
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { timelinePulseData: { ...data, ...patch } })
    }

    content = (
      <div className={cfStyles.cyberCard} style={{ border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0,212,255,0.03)' }}>
        <InspectorHeader icon={SVGIcons.timeline} title="Nhịp Xung Timeline" badge="TIMELINE" color="#00D4FF" />

        <div className={cfStyles.mb8}>
          <span className={cfStyles.sectionLabel}>Tiêu đề</span>
          <input
            className={styles.input}
            value={data.title || ''}
            onChange={e => updateData({ title: e.target.value })}
            placeholder="LỘ TRÌNH ĐỘT PHÁ"
            style={{ marginBottom: 0 }}
          />
        </div>

        <div className={cfStyles.grid2}>
          <ColorField label="Sóng xung" value={data.pulseColor || '#00D4FF'} onChange={c => updateData({ pulseColor: c })} />
          <ColorField label="Điểm nhấn" value={data.accentColor || '#BEFF01'} onChange={c => updateData({ accentColor: c })} />
        </div>

        <div className={cfStyles.sectionLabelMuted}>Các mốc thời gian ({data.milestones.length}):</div>
        {data.milestones.map((m, idx) => (
          <div key={idx} className={cfStyles.gridTimeTitle}>
            <input
              className={styles.input}
              value={m.time}
              onChange={e => {
                const next = [...data.milestones]
                next[idx] = { ...next[idx], time: e.target.value }
                updateData({ milestones: next })
              }}
              placeholder="09:00"
              style={{ marginBottom: 0 }}
            />
            <input
              className={styles.input}
              value={m.title}
              onChange={e => {
                const next = [...data.milestones]
                next[idx] = { ...next[idx], title: e.target.value }
                updateData({ milestones: next })
              }}
              placeholder="Tiêu đề mốc"
              style={{ marginBottom: 0 }}
            />
            <div className={cfStyles.colorDotCenter}>
              <ColorDot
                value={m.color || '#00D4FF'}
                onChange={c => {
                  const next = [...data.milestones]
                  next[idx] = { ...next[idx], color: c }
                  updateData({ milestones: next })
                }}
                sm
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 🏛️ 9. LIFECYCLE MATRIX (3 Cột Vòng Đời)
  if (type === 'lifecycle-matrix') {
    const data = element.lifecycleMatrixData || {
      title: 'EVALS vs GUARDRAILS vs MONITORING',
      subtitle: 'CONFLATE THEM → CREATE AN OPS GAP',
      activeColumnIndex: 1,
      columns: [
        { id: '1', stage: 'BEFORE SHIP', name: 'EVALS', actionVerb: 'MEASURE', icon: '📋', metrics: ['quality', 'reliability'], question: 'IS IT GOOD?', badgeText: 'RELEASE CONFIDENCE', color: '#00D4FF' },
        { id: '2', stage: 'DURING RUN', name: 'GUARDRAILS', actionVerb: 'ENFORCE', icon: '🛡️', metrics: ['policy', 'scope + limits'], question: 'IS IT ALLOWED?', badgeText: 'RUNTIME CONTROL', color: '#FF6B00' },
        { id: '3', stage: 'AFTER DEPLOY', name: 'MONITORING', actionVerb: 'DETECT', icon: '🖥️', metrics: ['drift + cost', 'latency'], question: 'IS IT HEALTHY?', badgeText: 'PRODUCTION TRUTH', color: '#00FF88' },
      ]
    }

    const updateData = (patch: Partial<typeof data>) => {
      updateElement(element.id, { lifecycleMatrixData: { ...data, ...patch } })
    }

    content = (
      <div className={cfStyles.cyberCard} style={{ border: '1px solid rgba(255,107,0,0.25)', background: 'rgba(255,107,0,0.03)' }}>
        <InspectorHeader icon={SVGIcons.lifecycle} title="Ma Trận 3 Cột Vòng Đời" badge="3-STAGE" color="#FF6B00" />

        {/* Tiêu đề & Phụ đề */}
        <div className={cfStyles.mb8}>
          <span className={cfStyles.sectionLabel}>Tiêu đề so sánh</span>
          <input
            className={styles.input}
            value={data.title || ''}
            onChange={e => updateData({ title: e.target.value })}
            placeholder="EVALS vs GUARDRAILS vs MONITORING"
            style={{ marginBottom: 0 }}
          />
        </div>

        <div className={cfStyles.mb8}>
          <span className={cfStyles.sectionLabel}>Phụ đề / Thông điệp</span>
          <input
            className={styles.input}
            value={data.subtitle || ''}
            onChange={e => updateData({ subtitle: e.target.value })}
            placeholder="CONFLATE THEM → CREATE AN OPS GAP"
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Chọn cột Highlight Active */}
        <div className={cfStyles.mb10}>
          <span className={cfStyles.sectionLabel}>Cột phát sáng Neon (Active Step)</span>
          <div className={cfStyles.grid2} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {data.columns.map((col, idx) => {
              const isActive = (data.activeColumnIndex ?? 1) === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateData({ activeColumnIndex: idx })}
                  style={{
                    padding: '5px 4px',
                    borderRadius: 6,
                    border: `1px solid ${isActive ? col.color : 'rgba(255,255,255,0.1)'}`,
                    background: isActive ? `${col.color}25` : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {col.name || `Cột ${idx + 1}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chi tiết từng cột */}
        <div className={cfStyles.sectionLabelMuted}>Chi tiết 3 cột ({data.columns.length}):</div>
        {data.columns.map((col, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${col.color}33`,
              borderRadius: 8,
              padding: '8px 10px',
              marginBottom: 8,
            }}
          >
            {/* Header cột: Stage + ColorDot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: col.color, fontFamily: 'monospace' }}>
                CỘT {idx + 1}: {col.stage}
              </span>
              <ColorDot
                value={col.color || '#00D4FF'}
                onChange={c => {
                  const next = [...data.columns];
                  next[idx] = { ...next[idx], color: c };
                  updateData({ columns: next });
                }}
                sm
              />
            </div>

            {/* Stage Tag + Icon */}
            <div className={cfStyles.grid2mb4} style={{ gridTemplateColumns: '1fr 60px' }}>
              <div>
                <span className={cfStyles.sectionLabel}>Giai đoạn (Stage)</span>
                <input
                  className={styles.input}
                  value={col.stage}
                  onChange={e => {
                    const next = [...data.columns];
                    next[idx] = { ...next[idx], stage: e.target.value };
                    updateData({ columns: next });
                  }}
                  placeholder="BEFORE SHIP"
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div>
                <span className={cfStyles.sectionLabel}>Icon</span>
                <input
                  className={styles.input}
                  value={col.icon}
                  onChange={e => {
                    const next = [...data.columns];
                    next[idx] = { ...next[idx], icon: e.target.value };
                    updateData({ columns: next });
                  }}
                  placeholder="Icon"
                  style={{ marginBottom: 0, textAlign: 'center' }}
                />
              </div>
            </div>

            {/* Tên + Động từ (Verb) */}
            <div className={cfStyles.grid2mb4}>
              <div>
                <span className={cfStyles.sectionLabel}>Tên (Noun)</span>
                <input
                  className={styles.input}
                  value={col.name}
                  onChange={e => {
                    const next = [...data.columns];
                    next[idx] = { ...next[idx], name: e.target.value };
                    updateData({ columns: next });
                  }}
                  placeholder="EVALS"
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div>
                <span className={cfStyles.sectionLabel}>Hành động (Verb)</span>
                <input
                  className={styles.input}
                  value={col.actionVerb}
                  onChange={e => {
                    const next = [...data.columns];
                    next[idx] = { ...next[idx], actionVerb: e.target.value };
                    updateData({ columns: next });
                  }}
                  placeholder="MEASURE"
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>

            {/* Câu hỏi (ASKS) + Badge Đáy */}
            <div className={cfStyles.grid2mb4}>
              <div>
                <span className={cfStyles.sectionLabel}>Câu hỏi (ASKS)</span>
                <input
                  className={styles.input}
                  value={col.question}
                  onChange={e => {
                    const next = [...data.columns];
                    next[idx] = { ...next[idx], question: e.target.value };
                    updateData({ columns: next });
                  }}
                  placeholder="IS IT GOOD?"
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div>
                <span className={cfStyles.sectionLabel}>Badge kết luận</span>
                <input
                  className={styles.input}
                  value={col.badgeText}
                  onChange={e => {
                    const next = [...data.columns];
                    next[idx] = { ...next[idx], badgeText: e.target.value };
                    updateData({ columns: next });
                  }}
                  placeholder="RELEASE CONFIDENCE"
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>

            {/* Metrics (dấu phẩy ngăn cách) */}
            <div>
              <span className={cfStyles.sectionLabel}>Metrics kiểm tra (ngăn cách bởi dấu phẩy)</span>
              <input
                className={styles.input}
                value={(col.metrics || []).join(', ')}
                onChange={e => {
                  const next = [...data.columns];
                  next[idx] = { ...next[idx], metrics: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                  updateData({ columns: next });
                }}
                placeholder="quality, reliability"
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!content) return null;

  return (
    <>
      <div className={styles.group}>
        <div className={styles.groupTitle}>
          <span>Kích thước tổng thể (Scale)</span>
        </div>
        <Slider
          label="Tỷ lệ (Scale)"
          value={element.scaleX || 1}
          min={0.1}
          max={3}
          step={0.05}
          display={v => `${v.toFixed(2)}x`}
          onChange={v => updateElement(element.id, { scaleX: v, scaleY: v })}
        />
      </div>
      {content}
    </>
  )
}
