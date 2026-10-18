/**
 * ── Lightweight Native Mermaid AST Compiler ─────────────────────────
 * Trình biên dịch cú pháp Mermaid chạy độc lập tại Client (~3KB, 0 dependency).
 * Chuyển đổi mã Mermaid (`graph TD`, `flowchart TD`, `A --> B`) sang cấu trúc dữ liệu
 * của các phần tử Remotion có sẵn (`flowchart`, `branching-flow`, `tree-diagram`).
 */

import { generateHarmonicPalette } from './brandPalette'

export interface ParsedMermaidNode {
  id: string
  label: string
  subLabel?: string
  shape?: 'rect' | 'circle' | 'diamond' | 'round' | 'pill' | 'cylinder'
}

export interface ParsedMermaidEdge {
  from: string
  to: string
  label?: string
}

export interface ParsedMermaidGraph {
  direction: 'TD' | 'LR'
  nodes: Map<string, ParsedMermaidNode>
  edges: ParsedMermaidEdge[]
  rawLines: string[]
}

/**
 * Phân tích cú pháp văn bản Mermaid thành Graph AST
 */
export function parseMermaidToAst(code: string): ParsedMermaidGraph {
  // Tách dòng theo xuống dòng hoặc dấu chấm phẩy ; (chuẩn cú pháp Mermaid)
  const lines = code
    .split(/[\r\n;]+/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('%%')) // Bỏ qua chú thích %%

  let direction: 'TD' | 'LR' = 'TD'
  const nodes = new Map<string, ParsedMermaidNode>()
  const edges: ParsedMermaidEdge[] = []

  // 1. Nhận diện Header (graph TD, flowchart LR, ...)
  if (lines.length > 0) {
    const first = lines[0].toLowerCase()
    if (first.includes('lr') || first.includes('rl')) {
      direction = 'LR'
    } else {
      direction = 'TD'
    }
  }

  // Helper trích xuất nhãn node: id[Nhãn bên trong] hoặc id(Nhãn) hoặc id{Nhãn}
  const extractNodeFromToken = (token: string): ParsedMermaidNode | null => {
    token = token.trim()
    if (!token) return null

    // Node dạng: id[Nội dung] hoặc id["Nội dung"]
    const squareMatch = token.match(/^([a-zA-Z0-9_\-]+)\s*\[(?:"|')?(.*?)(?:"|')?\]$/)
    if (squareMatch) {
      const parts = squareMatch[2].split(/[:|-]\s*/).map(p => p.trim())
      return {
        id: squareMatch[1],
        label: parts[0] || squareMatch[1],
        subLabel: parts[1] || '',
        shape: 'rect',
      }
    }

    // Node dạng: id(Nội dung)
    const roundMatch = token.match(/^([a-zA-Z0-9_\-]+)\s*\((?:"|')?(.*?)(?:"|')?\)$/)
    if (roundMatch) {
      const parts = roundMatch[2].split(/[:|-]\s*/).map(p => p.trim())
      return {
        id: roundMatch[1],
        label: parts[0] || roundMatch[1],
        subLabel: parts[1] || '',
        shape: 'round',
      }
    }

    // Node dạng: id{Nội dung} (Decision diamond)
    const diamondMatch = token.match(/^([a-zA-Z0-9_\-]+)\s*\{(?:"|')?(.*?)(?:"|')?\}$/)
    if (diamondMatch) {
      return {
        id: diamondMatch[1],
        label: diamondMatch[2] || diamondMatch[1],
        shape: 'diamond',
      }
    }

    // Node dạng text trơn: id
    const plainMatch = token.match(/^([a-zA-Z0-9_\-]+)$/)
    if (plainMatch) {
      return {
        id: plainMatch[1],
        label: plainMatch[1],
        shape: 'rect',
      }
    }

    return null
  }

  // 2. Duyệt từng dòng để tìm node và edge
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('graph') || line.startsWith('flowchart') || line.startsWith('subgraph')) {
      continue
    }

    // Nhận diện mối nối: A -->|text| B, A -- text --> B, A --> B, A --- B
    // QUAN TRỌNG: Cụm có nhãn (-->|...| hoặc -- ... -->) phải đặt trước --> để regex không bị nuốt mất phần nhãn
    const arrowRegex = /\s*(?:-->\|(.*?)\||--\s*(.*?)\s*-->|-->|---\s*)\s*/g
    const match = arrowRegex.exec(line)

    if (match) {
      const edgeLabel = (match[1] || match[2] || '').trim()
      const leftPart = line.slice(0, match.index).trim()
      const rightPart = line.slice(match.index + match[0].length).trim()

      const leftNode = extractNodeFromToken(leftPart)
      const rightNode = extractNodeFromToken(rightPart)

      if (leftNode) {
        if (!nodes.has(leftNode.id) || leftNode.label !== leftNode.id) {
          nodes.set(leftNode.id, leftNode)
        }
      }
      if (rightNode) {
        if (!nodes.has(rightNode.id) || rightNode.label !== rightNode.id) {
          nodes.set(rightNode.id, rightNode)
        }
      }

      if (leftNode && rightNode) {
        edges.push({
          from: leftNode.id,
          to: rightNode.id,
          label: edgeLabel || undefined,
        })
      }
    } else {
      // Có thể là khai báo node đơn lẻ: A[Nhãn]
      const singleNode = extractNodeFromToken(line)
      if (singleNode) {
        nodes.set(singleNode.id, singleNode)
      }
    }
  }

  return { direction, nodes, edges, rawLines: lines }
}

import { computeGraphLayout } from '@/config/graphLayout'
import { DiagramNode, DiagramEdge, DynamicDiagramData } from '@/types/scene'

/**
 * Chuyển đổi AST Mermaid sang phần tử Remotion Dynamic Diagram hoàn chỉnh.
 * Không bị ép vào template cũ - hỗ trợ đầy đủ rẽ nhánh điều kiện, vòng lặp tuần hoàn và đa hình khối.
 */
export function compileMermaidToRemotionElement(
  code: string,
  brandColor: string = '#BEFF01',
  titlePrompt?: string
): any {
  const ast = parseMermaidToAst(code)
  let nodeArray = Array.from(ast.nodes.values())

  // Fallback an toàn nếu code rỗng
  if (nodeArray.length === 0) {
    nodeArray = [
      { id: '1', label: 'Bắt đầu', subLabel: 'Thu thập ý tưởng', shape: 'pill' },
      { id: '2', label: 'Xử lý', subLabel: 'Sử dụng AI & Remotion', shape: 'rect' },
      { id: '3', label: 'Hoàn thành', subLabel: 'Xuất video Shorts', shape: 'pill' }
    ]
  }

  // Khống chế an toàn tối đa 6 nodes cho màn hình dọc 9:16
  const safeNodes = nodeArray.slice(0, 6)
  const safeNodeIds = new Set(safeNodes.map(n => n.id))

  const palette = generateHarmonicPalette(brandColor, Math.max(safeNodes.length, 5))

  // Chuyển đổi sang DiagramNode
  const diagramNodes: DiagramNode[] = safeNodes.map((n, idx) => {
    let shape: 'rect' | 'diamond' | 'pill' | 'circle' | 'cylinder' = 'rect'
    if (n.shape === 'diamond') shape = 'diamond'
    else if (n.shape === 'round') shape = 'pill'
    else if (n.shape === 'circle') shape = 'circle'

    return {
      id: n.id,
      label: n.label,
      sublabel: n.subLabel || undefined,
      shape,
      color: shape === 'diamond' ? '#00D4FF' : palette[idx % palette.length],
    }
  })

  // Lọc các cạnh nối chỉ thuộc tập safeNodes
  const diagramEdges: DiagramEdge[] = ast.edges
    .filter(e => safeNodeIds.has(e.from) && safeNodeIds.has(e.to))
    .map(e => ({
      from: e.from,
      to: e.to,
      label: e.label,
      color: brandColor,
    }))

  // Nếu không có cạnh nào (chỉ có nodes lẻ), tự tạo chuỗi nối thẳng
  if (diagramEdges.length === 0 && diagramNodes.length > 1) {
    for (let i = 0; i < diagramNodes.length - 1; i++) {
      diagramEdges.push({
        from: diagramNodes[i].id,
        to: diagramNodes[i + 1].id,
      })
    }
  }

  const diagramData: DynamicDiagramData = {
    title: titlePrompt || 'SƠ ĐỒ HỆ THỐNG',
    direction: ast.direction,
    nodes: diagramNodes,
    edges: diagramEdges,
  }

  const layout = computeGraphLayout(diagramData, 336)

  return {
    type: 'dynamic-diagram',
    left: 180,
    top: 180,
    width: 336,
    height: layout.height,
    accentColor: brandColor,
    diagramData,
    animPreset: 'zoom-in',
  }
}
