import React, { useState } from "react"
import tabStyles from "../Tabs.module.css"
import { InspectorProps, ColorDot, Slider } from "./common"
import { FormGroup, SectionHeader, Button, SegmentedControl } from "@/components/ui"
import { FORMULA_CATALOG, isValidFormula } from "@/remotion/elements/generativeSvg/formulaRegistry"
import { FormulaId, RenderStyle } from "@/remotion/elements/generativeSvg/types"
import { CINEMA_PALETTES } from "@/remotion/elements/generativeSvg/palettes"

const CATEGORY_TABS = [
  { value: "all", label: "Tất cả" },
  { value: "stem", label: "Khoa học" },
  { value: "finance", label: "Tài chính" },
  { value: "strategy", label: "Chiến lược" },
  { value: "cosmos", label: "Vũ trụ" },
  { value: "vitality", label: "Sinh mệnh" }
]

const RENDER_STYLES = [
  { value: "neon-cyber", label: "Hào quang" },
  { value: "minimal-hairline", label: "Tối giản" },
  { value: "hologram-radar", label: "Radar" },
  { value: "blueprint-cad", label: "Bản vẽ" }
]

export function GenerativeSvgInspector({ element, updateElement, showToast }: InspectorProps) {
  const currentTitle = element.title || "KINETIC METAPHOR"
  const currentAccent = element.accentColor || element.color || "var(--accent, #BEFF01)"
  const currentSecondary = element.secondaryColor || "var(--info, #00F2FE)"
  const currentFormula: FormulaId = isValidFormula(element.formula) ? element.formula : "quantum-orbit"
  const currentRenderStyle: RenderStyle = (element.renderStyle as RenderStyle) || "neon-cyber"
  const currentPaletteId = element.paletteId || ""

  const [activeTab, setActiveTab] = useState<string>("all")

  const handleFormulaSelect = (formulaId: FormulaId, formulaName: string) => {
    updateElement(element.id, {
      formula: formulaId,
      title: formulaName.toUpperCase(),
      svgContent: undefined,
      paths: undefined,
    })
    showToast("Đã đổi mô hình: " + formulaName)
  }

  const handleStyleSelect = (val: string) => {
    updateElement(element.id, { renderStyle: val })
  }

  const handlePaletteSelect = (paletteId: string, name: string, accent: string, secondary: string) => {
    updateElement(element.id, {
      paletteId,
      accentColor: accent,
      color: accent,
      secondaryColor: secondary
    })
    showToast("Đã áp dụng màu: " + name)
  }

  const filteredFormulas = FORMULA_CATALOG.filter(f => activeTab === "all" || f.category === activeTab)

  return (
    <div>
      <SectionHeader title="Thư viện công thức toán học" />
      
      <FormGroup label="Nhóm chủ đề" tooltip="Lọc các mô hình theo ngữ cảnh">
        <SegmentedControl
          options={CATEGORY_TABS}
          value={activeTab}
          onChange={setActiveTab}
          size="sm"
        />
      </FormGroup>

      <FormGroup label="Mô hình vector" tooltip="Chọn mô hình toán học tự động sinh đồ họa chuyển động 60fps">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
          {filteredFormulas.map((f) => {
            const isSelected = currentFormula === f.id
            return (
              <Button
                key={f.id}
                size="xs"
                variant={isSelected ? "primary" : "secondary"}
                onClick={() => handleFormulaSelect(f.id as FormulaId, f.name)}
                style={{
                  fontSize: "11px",
                  padding: "6px 4px",
                  textAlign: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={`${f.name} - ${f.description}`}
              >
                {f.name}
              </Button>
            )
          })}
        </div>
      </FormGroup>

      <SectionHeader title="Phong cách & Màu sắc" />

      <FormGroup label="Phong cách render" tooltip="Chế độ xử lý đường nét và filter phát sáng">
        <SegmentedControl
          options={RENDER_STYLES}
          value={currentRenderStyle}
          onChange={handleStyleSelect}
          size="sm"
        />
      </FormGroup>

      <FormGroup label="Bảng màu điện ảnh" tooltip="Sử dụng cặp màu tương phản chuẩn Studio">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
          {CINEMA_PALETTES.map((pal) => (
            <Button
              key={pal.id}
              size="xs"
              variant={currentPaletteId === pal.id ? "primary" : "secondary"}
              onClick={() => handlePaletteSelect(pal.id, pal.name, pal.accent, pal.secondary)}
              style={{
                display: "flex",
                gap: "4px",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={pal.name}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: pal.accent }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: pal.secondary }} />
            </Button>
          ))}
          <Button
            size="xs"
            variant={currentPaletteId === "" ? "primary" : "secondary"}
            onClick={() => updateElement(element.id, { paletteId: "" })}
            title="Sử dụng màu Brand Kit mặc định"
          >
            Brand
          </Button>
        </div>
      </FormGroup>

      <SectionHeader title="Tùy chỉnh phụ" />

      <FormGroup label="Tiêu đề hiển thị">
        <input
          type="text"
          className={tabStyles.input}
          value={currentTitle}
          onChange={(e) => updateElement(element.id, { title: e.target.value })}
          placeholder="e.g. QUỸ ĐẠO LƯỢNG TỬ"
        />
      </FormGroup>

      <FormGroup label="Kích thước hiển thị">
        <Slider
          label="Kích cỡ (px)"
          value={element.width || 220}
          min={140}
          max={320}
          step={10}
          display={(v) => v + "px"}
          onChange={(val) => updateElement(element.id, { width: val, height: val })}
        />
      </FormGroup>
    </div>
  )
}
