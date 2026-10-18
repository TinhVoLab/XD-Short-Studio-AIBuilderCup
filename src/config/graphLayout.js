/**
 * Bố cục đồ thị cho dynamic-diagram (toạ độ node, đường nối SVG, chiều cao co theo nội dung).
 * SSOT dùng chung cho DynamicDiagramElement (Remotion), renderer Fabric, mermaidParser và công thức
 * chiều cao layoutRegistry (Node server import được nên viết JS thuần; kiểu ở graphLayout.d.ts).
 */

/**
 * Split long text into balanced lines for mobile display
 */
function splitTextIntoLines(text, maxCharsPerLine) {
  const trimmed = (text || '').trim();
  if (trimmed.length <= maxCharsPerLine) return [trimmed];
  const words = trimmed.split(/\s+/);
  if (words.length <= 1) return [trimmed];
  const lines = [];
  let current = '';
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [trimmed];
}
/**
 * Computes content-adaptive coordinates and SVG paths for arbitrary graph topologies.
 * Auto-sizes node bounding boxes so Vietnamese text NEVER overflows or gets clipped.
 */
export function computeGraphLayout(data, containerWidth = 336, hasTitle = true) {
  const nodes = data.nodes || [];
  const edges = data.edges || [];
  if (nodes.length === 0) {
    return { width: containerWidth, height: 200, nodes: [], edges: [], maxLayer: 0 };
  }
  // 1. In-degree calculation
  const inDegree = {};
  const outgoing = {};
  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    outgoing[n.id] = [];
  });
  edges.forEach((e) => {
    if (inDegree[e.to] !== undefined) inDegree[e.to]++;
    if (outgoing[e.from]) outgoing[e.from].push(e.to);
  });
  // 2. Layer Assignment (BFS Topological Layering with cycle breaking)
  const layerMap = {};
  const visited = new Set();
  // Roots: nodes with in-degree 0 (or first node if all nodes participate in cycles)
  let roots = nodes.filter((n) => inDegree[n.id] === 0);
  if (roots.length === 0 && nodes.length > 0) roots = [nodes[0]];
  const queue = roots.map((r) => ({ id: r.id, layer: 0 }));
  roots.forEach((r) => {
    layerMap[r.id] = 0;
    visited.add(r.id);
  });
  while (queue.length > 0) {
    const { id, layer } = queue.shift();
    const nextList = outgoing[id] || [];
    for (const nextId of nextList) {
      if (!visited.has(nextId)) {
        visited.add(nextId);
        layerMap[nextId] = layer + 1;
        queue.push({ id: nextId, layer: layer + 1 });
      } else {
        if ((layerMap[nextId] ?? 0) <= layer && !isReachable(outgoing, nextId, id)) {
          layerMap[nextId] = layer + 1;
          queue.push({ id: nextId, layer: layer + 1 });
        }
      }
    }
  }
  // Fallback for unvisited disconnected components
  nodes.forEach((n, idx) => {
    if (layerMap[n.id] === undefined) {
      layerMap[n.id] = idx;
    }
  });
  // Group nodes by layer
  const layers = {};
  let maxLayer = 0;
  nodes.forEach((n) => {
    const l = layerMap[n.id] ?? 0;
    if (!layers[l]) layers[l] = [];
    layers[l].push(n);
    if (l > maxLayer) maxLayer = l;
  });
  // 3. Layout & Content Auto-Sizing
  const hasEdgeLabels = edges.some((e) => Boolean(e.label && e.label.trim()));
  const layerHeight = hasEdgeLabels ? 94 : 80;
  const paddingTop = hasTitle ? 40 : 20;
  const paddingBottom = 28;
  const computedHeight = paddingTop + (maxLayer + 1) * layerHeight + paddingBottom;
  const nodePosMap = new Map();
  const layoutedNodes = [];
  for (let l = 0; l <= maxLayer; l++) {
    const layerNodes = layers[l] || [];
    const count = layerNodes.length;
    const yCenter = paddingTop + l * layerHeight + 20;
    // Sắp xếp các node trên cùng tầng theo vị trí trung bình của node cha (Barycenter order)
    // Giúp các nhánh rẽ và hội tụ không bị bắt chéo đường nối
    if (l > 0 && layerNodes.length > 1) {
      layerNodes.sort((a, b) => {
        const getParentAvgX = (nodeId) => {
          const parentEdges = edges.filter((e) => e.to === nodeId);
          const parentXs = parentEdges.map((e) => nodePosMap.get(e.from)?.x).filter((x) => typeof x === 'number');
          if (parentXs.length === 0) return 0;
          return parentXs.reduce((sum, x) => sum + x, 0) / parentXs.length;
        };
        const avgA = getParentAvgX(a.id);
        const avgB = getParentAvgX(b.id);
        if (avgA !== 0 && avgB !== 0 && avgA !== avgB) {
          return avgA - avgB;
        }
        return 0;
      });
    }
    // Available horizontal space per node on this layer
    const maxAllowedWidth = Math.floor((containerWidth - 28) / count) - 12;
    layerNodes.forEach((node, idx) => {
      const shape = node.shape || 'rect';
      const labelText = (node.label || '').trim();
      const charWidth = 7.2;
      // Determine text lines & auto-fit dimensions
      let lines = [labelText];
      let nodeW = 100;
      let nodeH = 42;
      if (shape === 'diamond') {
        // Diamonds narrow at top/bottom, so text needs generous horizontal room
        if (labelText.length > 15 && count === 1) {
          lines = splitTextIntoLines(labelText, 14);
        }
        const longestLine = Math.max(...lines.map((ln) => ln.length));
        const estimatedTextW = longestLine * charWidth;
        // Diamond formula: width needs to be ~1.4x the text width for comfortable padding
        nodeW = Math.min(maxAllowedWidth, Math.max(110, Math.round(estimatedTextW * 1.38 + 36)));
        nodeH = lines.length > 1 ? 62 : Math.max(52, Math.round(nodeW * 0.44));
      } else if (shape === 'circle') {
        nodeW = Math.min(maxAllowedWidth, Math.max(48, Math.round(labelText.length * 6.5 + 20)));
        nodeH = nodeW;
      } else {
        // rect or pill or cylinder
        const maxCharsSingleLine = Math.floor((maxAllowedWidth - 32) / charWidth);
        if (labelText.length > maxCharsSingleLine && labelText.includes(' ')) {
          lines = splitTextIntoLines(labelText, Math.max(12, maxCharsSingleLine));
        }
        const longestLine = Math.max(...lines.map((ln) => ln.length));
        const estimatedTextW = longestLine * charWidth;
        const padX = shape === 'pill' ? 36 : 28;
        nodeW = Math.min(maxAllowedWidth, Math.max(100, Math.round(estimatedTextW + padX)));
        nodeH = lines.length > 1 ? 48 : 42;
      }
      // Distribute evenly across X axis
      const xCenter = (containerWidth / (count + 1)) * (idx + 1);
      const layouted = {
        ...node,
        shape,
        x: Math.round(xCenter),
        y: Math.round(yCenter),
        width: Math.round(nodeW),
        height: Math.round(nodeH),
        layer: l,
        lines,
      };
      layoutedNodes.push(layouted);
      nodePosMap.set(node.id, layouted);
    });
  }
  // 4. Edge Routing & SVG Paths Generation
  const layoutedEdges = edges.map((e) => {
    const fromNode = nodePosMap.get(e.from);
    const toNode = nodePosMap.get(e.to);
    if (!fromNode || !toNode) {
      return {
        ...e,
        pathD: '',
        labelX: 0,
        labelY: 0,
      };
    }
    const fromLayer = fromNode.layer ?? 0;
    const toLayer = toNode.layer ?? 0;
    const isFeedback = fromLayer >= toLayer;
    let pathD = '';
    let labelX = 0;
    let labelY = 0;
    if (isFeedback) {
      // Loop back arc (curves elegantly on the side)
      const isLeft = fromNode.x <= containerWidth / 2;
      const startX = isLeft ? fromNode.x - fromNode.width / 2 : fromNode.x + fromNode.width / 2;
      const startY = fromNode.y;
      const endX = isLeft ? toNode.x - toNode.width / 2 : toNode.x + toNode.width / 2;
      const endY = toNode.y;
      const curveX = isLeft
        ? Math.max(16, Math.min(startX, endX) - 36)
        : Math.min(containerWidth - 16, Math.max(startX, endX) + 36);
      pathD = `M ${startX} ${startY} C ${curveX} ${startY}, ${curveX} ${endY}, ${endX} ${endY}`;
      labelX = curveX;
      labelY = (startY + endY) / 2;
    } else {
      // Forward edge: from bottom of fromNode to top of toNode
      const startX = fromNode.x;
      const startY = fromNode.y + fromNode.height / 2;
      const endX = toNode.x;
      const endY = toNode.y - toNode.height / 2;
      if (Math.abs(startX - endX) < 8) {
        // Straight downward connection
        pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
        labelX = startX;
        labelY = (startY + endY) / 2;
      } else {
        // Smooth Cubic Bezier S-curve
        const midY = (startY + endY) / 2;
        pathD = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
        labelX = (startX + endX) / 2;
        labelY = midY;
      }
    }
    return {
      ...e,
      pathD,
      labelX: Math.round(labelX),
      labelY: Math.round(labelY),
      isFeedback,
    };
  });
  return {
    width: containerWidth,
    height: Math.max(240, computedHeight),
    nodes: layoutedNodes,
    edges: layoutedEdges,
    maxLayer,
  };
}
/** Check if target is reachable from start (cycle detection) */
function isReachable(outgoing, start, target) {
  const visited = new Set();
  const stack = [start];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (cur === target) return true;
    if (!visited.has(cur)) {
      visited.add(cur);
      const nextList = outgoing[cur] || [];
      for (const nxt of nextList) stack.push(nxt);
    }
  }
  return false;
}
