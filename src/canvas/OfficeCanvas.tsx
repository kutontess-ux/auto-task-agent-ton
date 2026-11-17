import React, { useEffect, useRef, useState } from 'react';
import { Agent } from '../types/agent';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './officeMap';
import { drawAgentSprite, drawOfficeBackground, drawSpeechBubble } from './pixelSprites';

interface OfficeCanvasProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
}

export const OfficeCanvas: React.FC<OfficeCanvasProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const agentsRef = useRef<Agent[]>(agents);
  const selectedRef = useRef<string | null>(selectedAgentId);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  agentsRef.current = agents;
  selectedRef.current = selectedAgentId;
  hoveredRef.current = hoveredAgentId;

  useEffect(() => {
    let rafId = 0;
    const render = (nowMs: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const timeSec = nowMs / 1000;
          ctx.imageSmoothingEnabled = false;
          drawOfficeBackground(ctx, timeSec);

          // Sort agents by Y for proper top-down depth overlap
          const sorted = [...agentsRef.current].sort((a, b) => a.position.y - b.position.y);
          for (const agent of sorted) {
            drawAgentSprite(
              ctx,
              agent,
              agent.id === selectedRef.current,
              agent.id === hoveredRef.current,
              timeSec
            );
          }

          // Draw speech bubbles on top of all characters
          for (const agent of sorted) {
            drawSpeechBubble(ctx, agent);
          }
        }
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const findAgentAt = (clientX: number, clientY: number): Agent | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;

    for (let i = agentsRef.current.length - 1; i >= 0; i--) {
      const a = agentsRef.current[i];
      if (
        px >= a.position.x - 16 &&
        px <= a.position.x + 16 &&
        py >= a.position.y - 26 &&
        py <= a.position.y + 18
      ) {
        return a;
      }
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = findAgentAt(e.clientX, e.clientY);
    if (hit) {
      onSelectAgent(hit.id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const hit = findAgentAt(e.clientX, e.clientY);
    setHoveredAgentId(hit ? hit.id : null);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        background: 'radial-gradient(circle at center, #161e2e 0%, #0b0f17 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredAgentId(null)}
        className="pixel-canvas"
        style={{
          width: '100%',
          maxWidth: '1040px',
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          borderRadius: '10px',
          border: '3px solid #303a4d',
          boxShadow: '0 14px 40px rgba(0, 0, 0, 0.65)',
          cursor: hoveredAgentId ? 'pointer' : 'default',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '24px',
          background: 'rgba(13, 17, 23, 0.85)',
          border: '1px solid #303a4d',
          borderRadius: '6px',
          padding: '6px 10px',
          fontSize: '12px',
          color: '#94a3b8',
          pointerEvents: 'none',
        }}
      >
        💡 Click vào từng nhân vật trên bản đồ để xem chỉ số & Terminal Log
      </div>
    </div>
  );
};
