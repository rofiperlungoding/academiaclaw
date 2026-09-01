import React, { useRef, useEffect, useState } from 'react';
import type { Entity, Relation, Topic } from '../types';
import { ZoomIn, ZoomOut, RefreshCw, Layers } from 'lucide-react';

interface GraphVisualizerProps {
  entities: Entity[];
  relations: Relation[];
  topics?: Topic[];
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
  weight: number;
}

export const GraphVisualizer: React.FC<GraphVisualizerProps> = ({
  entities,
  relations,
  onSelectNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<NodeData | null>(null);

  const nodesRef = useRef<NodeData[]>([]);
  const edgesRef = useRef<EdgeData[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const getColorForType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'algorithm':
        return '#38BDF8';
      case 'hardware':
      case 'architecture':
        return '#818CF8';
      case 'formula':
        return '#F43F5E';
      case 'topic':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  useEffect(() => {
    const width = 800;
    const height = 500;

    const nodeMap = new Map<string, NodeData>();

    entities.forEach((ent, i) => {
      const angle = (i / Math.max(1, entities.length)) * Math.PI * 2;
      const dist = 140 + (i % 3) * 40;
      nodeMap.set(ent.name, {
        id: ent.id,
        name: ent.name,
        type: ent.entity_type,
        desc: ent.description,
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 18,
        color: getColorForType(ent.entity_type),
      });
    });

    const edges: EdgeData[] = [];
    relations.forEach((rel) => {
      const s = nodeMap.get(rel.source_name);
      const t = nodeMap.get(rel.target_name);
      if (s && t) {
        edges.push({
          source: s,
          target: t,
          relation: rel.relation_type,
          weight: rel.weight,
        });
      }
    });

    nodesRef.current = Array.from(nodeMap.values());
    edgesRef.current = edges;
  }, [entities, relations]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const simulateAndRender = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const width = canvas.width;
      const height = canvas.height;

      nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
          if (i >= j) return;
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) / dist * 0.08;
            n1.vx -= dx * force;
            n1.vy -= dy * force;
            n2.vx += dx * force;
            n2.vy += dy * force;
          }
        });

        const cdx = width / 2 - n1.x;
        const cdy = height / 2 - n1.y;
        n1.vx += cdx * 0.003;
        n1.vy += cdy * 0.003;
      });

      edges.forEach((edge) => {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredDist = 110;
        const springForce = (dist - desiredDist) * 0.015;
        
        edge.source.vx += (dx / dist) * springForce;
        edge.source.vy += (dy / dist) * springForce;
        edge.target.vx -= (dx / dist) * springForce;
        edge.target.vy -= (dy / dist) * springForce;
      });

      nodes.forEach((node) => {
        if (node === draggedNode) return;
        node.vx *= 0.88;
        node.vy *= 0.88;
        node.x += node.vx;
        node.y += node.vy;

        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      });

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      edges.forEach((edge) => {
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const midX = (edge.source.x + edge.target.x) / 2;
        const midY = (edge.source.y + edge.target.y) / 2;
        ctx.fillStyle = '#64748B';
        ctx.font = '9px monospace';
        ctx.fillText(edge.relation, midX + 4, midY - 4);
      });

      nodes.forEach((node) => {
        const isSelected = selectedNode?.name === node.name;
        const isHovered = hoveredNode?.name === node.name;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + (isSelected ? 4 : 0), 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isSelected || isHovered ? 16 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.strokeStyle = isSelected ? '#FFFFFF' : '#1E293B';
        ctx.stroke();

        ctx.fillStyle = '#F8FAFC';
        ctx.font = isSelected ? 'bold 12px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + node.radius + 14);
      });

      ctx.restore();

      if (isRunning) {
        animFrameRef.current = requestAnimationFrame(simulateAndRender);
      }
    };

    animFrameRef.current = requestAnimationFrame(simulateAndRender);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [pan, zoom, draggedNode, selectedNode, hoveredNode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    const clickedNode = nodesRef.current.find((n) => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
    });

    if (clickedNode) {
      setDraggedNode(clickedNode);
      setSelectedNode(clickedNode);
      if (onSelectNode) onSelectNode(clickedNode.name);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    if (draggedNode) {
      draggedNode.x = mouseX;
      draggedNode.y = mouseY;
    } else if (isDraggingCanvas) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      const hoverNode = nodesRef.current.find((n) => {
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        return Math.sqrt(dx * dx + dy * dy) <= n.radius + 6;
      });
      setHoveredNode(hoverNode || null);
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsDraggingCanvas(false);
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-800 bg-[#070A10]">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
        <Layers className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-slate-300 font-medium">Dual-Level Graph</span>
        <span className="text-slate-500">|</span>
        <span className="text-emerald-400">{entities.length} Nodes</span>
        <span className="text-slate-500">·</span>
        <span className="text-blue-400">{relations.length} Edges</span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 text-xs">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 transition-colors"
          title="Reset View"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={900}
        height={480}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-[480px] cursor-grab active:cursor-grabbing block"
      />

      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700/80 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start gap-3">
            <div
              className="w-4 h-4 rounded-full mt-1 shrink-0"
              style={{ backgroundColor: selectedNode.color }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-100 text-sm">{selectedNode.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {selectedNode.type}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                {selectedNode.desc || 'No additional description available for this entity.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 self-end md:self-auto border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
