import React, { useRef, useEffect, useState } from 'react';
import type { KnowledgeGraphData } from '../types';
import { ZoomIn, ZoomOut, RefreshCw, X } from 'lucide-react';

interface GraphVisualizerProps {
  data: KnowledgeGraphData;
  onSelectNode?: (nodeName: string) => void;
}

interface NodeData {
  id: string;
  name: string;
  type: string;
  desc: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface EdgeData {
  source: NodeData;
  target: NodeData;
  relation: string;
}

const W = 900;
const H = 400;

/** Muted palette — readable on white without shouting. */
const TYPE_COLORS: Record<string, string> = {
  algorithm: '#4F46E5',
  architecture: '#0E7490',
  hardware: '#0E7490',
  formula: '#B45309',
  topic: '#7C3AED',
};
const colorFor = (type: string) => TYPE_COLORS[type.toLowerCase()] ?? '#52525B';

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({ data, onSelectNode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [zoom, setZoom] = useState(1);

  // Visual/interaction state lives in refs so the render loop never restarts.
  const nodesRef = useRef<NodeData[]>([]);
  const edgesRef = useRef<EdgeData[]>([]);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const selectedRef = useRef<NodeData | null>(null);
  const hoveredRef = useRef<NodeData | null>(null);
  const draggedRef = useRef<NodeData | null>(null);
  const canvasDragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const nodeMap = new Map<string, NodeData>();

    data.entities.forEach((ent, i) => {
      const angle = (i / Math.max(1, data.entities.length)) * Math.PI * 2;
      const dist = 120 + (i % 3) * 35;
      nodeMap.set(ent.name, {
        id: ent.id,
        name: ent.name,
        type: ent.entity_type,
        desc: ent.description,
        x: W / 2 + Math.cos(angle) * dist,
        y: H / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 6,
        color: colorFor(ent.entity_type),
      });
    });

    const edges: EdgeData[] = [];
    data.relations.forEach((rel) => {
      const s = nodeMap.get(rel.source_name);
      const t = nodeMap.get(rel.target_name);
      if (s && t) edges.push({ source: s, target: t, relation: rel.relation_type });
    });

    nodesRef.current = Array.from(nodeMap.values());
    edgesRef.current = edges;
    setSelectedNode(null);
    selectedRef.current = null;
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let frame = 0;

    const render = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      // ponytail: O(n^2) repulsion. Fine under ~200 nodes; switch to a quadtree past that.
      nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
          if (i >= j) return;
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 160) {
            const force = ((160 - dist) / dist) * 0.07;
            n1.vx -= dx * force;
            n1.vy -= dy * force;
            n2.vx += dx * force;
            n2.vy += dy * force;
          }
        });
        n1.vx += (W / 2 - n1.x) * 0.003;
        n1.vy += (H / 2 - n1.y) * 0.003;
      });

      edges.forEach((edge) => {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.hypot(dx, dy) || 1;
        const spring = (dist - 110) * 0.012;
        edge.source.vx += (dx / dist) * spring;
        edge.source.vy += (dy / dist) * spring;
        edge.target.vx -= (dx / dist) * spring;
        edge.target.vy -= (dy / dist) * spring;
      });

      nodes.forEach((node) => {
        if (node === draggedRef.current) return;
        node.vx *= 0.88;
        node.vy *= 0.88;
        node.x = Math.max(30, Math.min(W - 30, node.x + node.vx));
        node.y = Math.max(24, Math.min(H - 24, node.y + node.vy));
      });

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);

      const active = selectedRef.current || hoveredRef.current;

      edges.forEach((edge) => {
        const touched =
          active && (edge.source.name === active.name || edge.target.name === active.name);
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        ctx.strokeStyle = touched ? '#A1A1AA' : '#E4E4E7';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (touched) {
          ctx.fillStyle = '#A1A1AA';
          ctx.font = '9px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            edge.relation,
            (edge.source.x + edge.target.x) / 2,
            (edge.source.y + edge.target.y) / 2 - 5
          );
        }
      });

      nodes.forEach((node) => {
        const isActive = active?.name === node.name;

        ctx.beginPath();
        ctx.arc(node.x, node.y, isActive ? node.radius + 1.5 : node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.fillStyle = isActive ? '#18181B' : '#71717A';
        ctx.font = `${isActive ? '600 ' : ''}10px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + node.radius + 13);
      });

      ctx.restore();
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, []);

  /** Canvas is a fixed 900x400 coordinate space stretched by CSS — rescale pointer coords. */
  const toGraphCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    return {
      x: ((e.clientX - rect.left) * sx - panRef.current.x) / zoomRef.current,
      y: ((e.clientY - rect.top) * sy - panRef.current.y) / zoomRef.current,
    };
  };

  const nodeAt = (x: number, y: number) =>
    nodesRef.current.find((n) => Math.hypot(n.x - x, n.y - y) <= n.radius + 8) ?? null;

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toGraphCoords(e);
    const clicked = nodeAt(x, y);
    if (clicked) {
      draggedRef.current = clicked;
      selectedRef.current = clicked;
      setSelectedNode(clicked);
      onSelectNode?.(clicked.name);
    } else {
      canvasDragRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = toGraphCoords(e);
    if (draggedRef.current) {
      draggedRef.current.x = x;
      draggedRef.current.y = y;
    } else if (canvasDragRef.current) {
      panRef.current = {
        x: e.clientX - canvasDragRef.current.x,
        y: e.clientY - canvasDragRef.current.y,
      };
    } else {
      hoveredRef.current = nodeAt(x, y);
    }
  };

  const handleMouseUp = () => {
    draggedRef.current = null;
    canvasDragRef.current = null;
  };

  const reset = () => {
    setZoom(1);
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
  };

  const closeDetail = () => {
    setSelectedNode(null);
    selectedRef.current = null;
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2.5 text-[11px] text-zinc-400">
        <span>{data.entities.length} nodes</span>
        <span>{data.relations.length} edges</span>
      </div>

      <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="btn-ghost btn-sm"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="btn-ghost btn-sm"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button onClick={reset} className="btn-ghost btn-sm" aria-label="Reset view">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block w-full h-full cursor-grab active:cursor-grabbing"
      />

      {selectedNode && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-white border border-zinc-200 rounded-lg px-4 py-3 shadow-overlay flex items-start gap-3 animate-fade-in">
          <span
            className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: selectedNode.color }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-zinc-900">
              {selectedNode.name}
              <span className="ml-2 font-normal text-[11px] text-zinc-400">{selectedNode.type}</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 line-clamp-3">
              {selectedNode.desc || 'No additional description.'}
            </p>
          </div>
          <button onClick={closeDetail} className="btn-ghost btn-sm shrink-0" aria-label="Close">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
