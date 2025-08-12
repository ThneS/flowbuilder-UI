import React, { useEffect, useRef, useState } from 'react';
import useWorkflowStore from '../../state/workflowStore';

// 连线组件
const ConnectionLine: React.FC<{
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  isActive?: boolean;
}> = ({ fromX, fromY, toX, toY, isActive = false }) => {
  // 计算贝塞尔曲线控制点
  const controlX1 = fromX + (toX - fromX) / 3;
  const controlY1 = fromY;
  const controlX2 = toX - (toX - fromX) / 3;
  const controlY2 = toY;

  return (
    <path
      d={`M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`}
      fill="none"
      stroke={isActive ? '#3b82f6' : '#cbd5e1'}
      strokeWidth={isActive ? 2.5 : 1.5}
      className="pointer-events-none"
      strokeDasharray={isActive ? '0' : '4 2'}
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
  isActive: boolean;
  isBeingDragged: boolean;
  onDragStart: (id: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrag: (dx: number, dy: number) => void;
  onClick: (id: string) => void;
  onLinkStart: (id: string) => void;
}> = ({
  id, x, y, name, type, isActive, isBeingDragged,
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
        width="180"
        height="80"
        rx="6"
        fill="white"
        stroke={isActive ? '#3b82f6' : '#e2e8f0'}
        strokeWidth={isActive ? 2 : 1}
        className={`shadow-md ${isActive ? 'ring-2 ring-blue-200' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick(id);
        }}
      />
      <rect
        width="180"
        height="6"
        rx="3"
        fill={getTypeColor(type)}
        className="mb-4"
      />
      <text
        x="90"
        y="35"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-gray-800 font-medium text-sm"
      >
        {name}
      </text>
      <text
        x="90"
        y="55"
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs text-gray-500"
      >
        {type}
      </text>
      <circle
        cx="180"
        cy="40"
        r="8"
        fill={isActive ? '#dbeafe' : '#f1f5f9'}
        stroke={isActive ? '#3b82f6' : '#cbd5e1'}
        strokeWidth={1.5}
        onClick={(e) => {
          e.stopPropagation();
          onLinkStart(id);
        }}
        className="cursor-crosshair"
      />
      <circle
        cx="0"
        cy="40"
        r="8"
        fill={isActive ? '#dbeafe' : '#f1f5f9'}
        stroke={isActive ? '#3b82f6' : '#cbd5e1'}
        strokeWidth={1.5}
        className="pointer-events-none"
      />
      <foreignObject x="0" y="0" width="180" height="80">
        <div
          className="h-full w-full"
          draggable
          onDragStart={(e) => onDragStart(id, e)}
          onDragEnd={onDragEnd}
        />
      </foreignObject>
    </g>
  );
};

// 主要画布组件
const FlowBuilderCanvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { actions, workflow, linkingFrom, updateAction, linkActions, setActiveActionId, generateUid, addAction, activeActionId } = useWorkflowStore();
  const [draggedActionId, setDraggedActionId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
    setActiveActionId(id);
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
      setActiveActionId(null);
    }
  };

  // 处理画布拖拽
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 200, y: 200 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.target === svgRef.current && event.button === 1) {
      setIsPanning(true);
      setPanStart({
        x: event.clientX - panOffset.x,
        y: event.clientY - panOffset.y,
      });
    } else if (event.button === 0 && event.target === svgRef.current) {
      // 左键点击画布空白处也取消选中
      setActiveActionId(null);
      if (linkingFrom) {
        useWorkflowStore.setState({
          linkingFrom: null,
        });
      }
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
          const isActiveConnection = activeActionId === id || activeActionId === action.flow.next;
          connections.push(
            <ConnectionLine
              key={`${id}-${action.flow.next}`}
              fromX={action.x + 180}
              fromY={action.y + 40}
              toX={nextAction.x}
              toY={nextAction.y + 40}
              isActive={isActiveConnection}
            />
          );
        }
      }
    });

    return connections;
  };

  return (
    <div className="dify-canvas-container">
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
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="0.8"
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
              isActive={id === activeActionId}
              isBeingDragged={draggedActionId === id}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              onClick={handleNodeClick}
              onLinkStart={handleLinkStart}
            />
          ))}

          {/* 渲染起点节点 */}
          <g transform={`translate(50, 150)`}>
            <rect
              width="120"
              height="60"
              rx="4"
              fill="#ecfdf5"
              stroke="#10b981"
              strokeWidth="1.5"
              className="shadow-sm"
            />
            <text
              x="60"
              y="25"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-gray-800 font-medium text-sm"
            >
              开始
            </text>
            <text
              x="60"
              y="45"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs text-gray-500"
            >
              start
            </text>
            <circle
              cx="120"
              cy="30"
              r="6"
              fill="#d1fae5"
              stroke="#10b981"
              strokeWidth={1}
              onClick={(e) => {
                e.stopPropagation();
                const firstAction = Array.from(actions.entries())[0];
                if (firstAction) {
                  linkActions('start', firstAction[0]);
                }
              }}
              className="cursor-crosshair"
            />
          </g>
        </g>
      </svg>

      {/* 画布操作工具栏 */}
      <div className="dify-canvas-tools">
        <button
          className="dify-btn dify-btn-secondary"
          onClick={() => {
            // 实现自动排版功能
          }}
        >
          自动排版
        </button>
        <button
          className="dify-btn dify-btn-secondary"
          onClick={() => {
            // 实现放大功能
          }}
        >
          放大
        </button>
        <button
          className="dify-btn dify-btn-secondary"
          onClick={() => {
            // 实现缩小功能
          }}
        >
          缩小
        </button>
        <button
          className="dify-btn dify-btn-secondary"
          onClick={() => {
            setPanOffset({ x: 200, y: 200 });
          }}
        >
          重置视图
        </button>
      </div>

      {/* 画布提示 */}
      <div className="dify-canvas-hint">
        <div className="hint-item">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          拖动节点移动位置
        </div>
        <div className="hint-item">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          点击节点右侧连接点创建连线
        </div>
        <div className="hint-item">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          滚轮或中键拖动平移画布
        </div>
      </div>
    </div>
  );
};

export default FlowBuilderCanvas;