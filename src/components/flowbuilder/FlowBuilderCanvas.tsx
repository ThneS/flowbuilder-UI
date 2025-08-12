import React, { useEffect, useRef } from 'react';
import useWorkflowStore from '../../state/workflowStore';

// 连线组件
const ConnectionLine: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}> = ({ fromX, fromY, toX, toY }) => {
  // 计算贝塞尔曲线控制点
  const controlX1 = fromX + (toX - fromX) / 3;
  const controlY1 = fromY;
  const controlX2 = toX - (toX - fromX) / 3;
  const controlY2 = toY;

  return (
    <path
      d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`}
      fill="none"
      stroke="#94a3b8"
      strokeWidth="2"
      className="pointer-events-none"
    />
  );
};

// 动作节点组件
const ActionNode: React.FC<{
  id: string;
  x: number;
  y: number;
  name: string;
  type: string;
  isBeingDragged: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrag: (dx: number, dy: number) => void;
  onClick: (id: string) => void;
  onLinkStart: (id: string) => void;
}> = ({
  id, x, y, name, type, isBeingDragged,
  onDragStart, onDragEnd, onDrag, onClick, onLinkStart
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'builtin': return 'bg-blue-500';
      case 'cmd': return 'bg-green-500';
      case 'http': return 'bg-purple-500';
      case 'wasm': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={`cursor-move ${isBeingDragged ? 'opacity-70' : ''}`}
    >
      <rect
        width="150"
        height="70"
        rx="8"
        fill="white"
        stroke="#e2e8f0"
        strokeWidth="2"
        className="shadow-lg"
        onClick={(e) => {
          e.stopPropagation();
          onClick(id);
        }}
      />
      <rect
        width="150"
        height="10"
        rx="4"
        fill={getTypeColor(type)}
        className="mb-2"
      />
      <text
        x="75"
        y="35"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-gray-800 font-medium"
      >
        {name}
      </text>
      <text
        x="75"
        y="55"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs text-gray-500"
      >
        {type}
      </text>
      <circle
        cx="150"
        cy="35"
        r="8"
        fill="#e2e8f0"
        stroke="#94a3b8"
        strokeWidth="1"
        onClick={(e) => {
          e.stopPropagation();
          onLinkStart(id);
        }}
        className="cursor-crosshair"
      />
      <foreignObject x="0" y="0" width="150" height="70">
        <div
          className="h-full w-full"
          draggable
          onDragStart={() => onDragStart(id)}
          onDragEnd={onDragEnd}
        />
      </foreignObject>
    </g>
  );
};

// 主要画布组件
const FlowBuilderCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { actions, workflow, linkingFrom, updateAction, linkActions, setActiveTaskId, generateUid, addAction } = useWorkflowStore();
  const [draggedActionId, setDraggedActionId] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 处理拖动开始
  const handleDragStart = (id: string, event: React.DragEvent) => {
    const action = actions.get(id);
    if (!action) return;

    setDraggedActionId(id);
    setDragOffset({
      x: event.clientX - action.x,
      y: event.clientY - action.y,
    });
  };

  // 处理拖动结束
  const handleDragEnd = () => {
    setDraggedActionId(null);
  };

  // 处理拖动
  const handleDrag = (event: React.DragEvent) => {
    if (!draggedActionId) return;

    const action = actions.get(draggedActionId);
    if (!action) return;

    const newX = event.clientX - dragOffset.x;
    const newY = event.clientY - dragOffset.y;

    updateAction(draggedActionId, {
      x: newX,
      y: newY,
    });
  };

  // 处理节点点击
  const handleNodeClick = (id: string) => {
    setActiveTaskId(id);
  };

  // 处理连线开始
  const handleLinkStart = (id: string) => {
    useWorkflowStore.setState({
      linkingFrom: id,
    });
  };

  // 处理连线结束
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (linkingFrom) {
      // 取消连线
      useWorkflowStore.setState({
        linkingFrom: null,
      });
    } else if (event.target === svgRef.current) {
      // 取消选中
      setActiveTaskId(null);
    }
  };

  // 处理画布拖拽
  const [panOffset, setPanOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.target === svgRef.current && event.button === 1) {
      setIsPanning(true);
      setPanStart({
        x: event.clientX - panOffset.x,
        y: event.clientY - panOffset.y,
      });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // 生成所有连线
  const renderConnections = () => {
    const connections: React.ReactNode[] = [];

    actions.forEach((action, id) => {
      if (action.flow.next && actions.has(action.flow.next)) {
        const nextAction = actions.get(action.flow.next);
        if (nextAction) {
          connections.push(
            <ConnectionLine
              key={`${id}-${action.flow.next}`}
              fromX={action.x + 150}
              fromY={action.y + 35}
              toX={nextAction.x + 10}
              toY={nextAction.y + 35}
            />
          );
        }
      }
    });

    return connections;
  };

  return (
    <div className="w-full h-full bg-gray-50 overflow-hidden relative">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="cursor-default"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDragEnd}
      >
        <g transform={`translate(${panOffset.x}, ${panOffset.y})`}>
          {/* 网格背景 */}
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          </pattern>
          <rect
            width="100%"
            height="100%"
            fill="url(#grid)"
            className="pointer-events-none"
          />

          {/* 渲染连线 */}
          {renderConnections()}

          {/* 渲染动作节点 */}
          {Array.from(actions.entries()).map(([id, action]) => (
            <ActionNode
              key={id}
              id={id}
              x={action.x}
              y={action.y}
              name={action.name}
              type={action.type}
              isBeingDragged={draggedActionId === id}
              onDragStart={(id) => handleDragStart(id, { clientX: 0, clientY: 0 } as any)}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              onClick={handleNodeClick}
              onLinkStart={handleLinkStart}
            />
          ))}
        </g>
      </svg>

      {/* 添加动作按钮 (固定在右下角) */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button
          onClick={() => {
            const activeTask = workflow.tasks.find(t => t.id === useWorkflowStore.getState().activeTaskId);
            if (activeTask) {
              addAction(
                activeTask.id,
                'builtin',
                `Action ${generateUid()}`,
                panOffset.x + 100,
                panOffset.y + 100
              );
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FlowBuilderCanvas;