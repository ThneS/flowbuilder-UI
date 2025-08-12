import React, { useState } from 'react';
import FlowBuilderCanvas from './FlowBuilderCanvas';
import PropertyEditor from './PropertyEditor';
import useWorkflowStore from '../../state/workflowStore';
import { exportWorkflowToJson, exportWorkflowToYaml, importWorkflowFromJson, importWorkflowFromYaml } from '../../utils/workflowUtils';
import '../../styles/difyTheme.css';

// 工作流设计器主组件
const FlowBuilderDesigner: React.FC = () => {
  const { addTask, workflow, setActiveTaskId, activeTaskId } = useWorkflowStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);
  const [importExportFormat, setImportExportFormat] = useState<'json' | 'yaml'>('json');
  const [importContent, setImportContent] = useState('');

  // 导出工作流
  const handleExport = () => {
    let content = '';
    if (importExportFormat === 'json') {
      content = exportWorkflowToJson();
    } else {
      content = exportWorkflowToYaml();
    }

    // 创建下载链接
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow.${importExportFormat}`;
    a.click();
    URL.revokeObjectURL(url);

    setImportExportModalOpen(false);
  };

  // 导入工作流
  const handleImport = () => {
    try {
      if (importExportFormat === 'json') {
        importWorkflowFromJson(importContent);
      } else {
        importWorkflowFromYaml(importContent);
      }
      setImportExportModalOpen(false);
      setImportContent('');
    } catch (error) {
      alert('Failed to import workflow: ' + error.message);
    }
  };

  const [newTaskName, setNewTaskName] = useState('New Task');

  // 添加新任务
  const handleAddTask = () => {
    if (newTaskName.trim()) {
      addTask(newTaskName);
      setNewTaskName('New Task');
    }
  };

  return (
    <div className="dify-container">
      {/* 顶部导航栏 */}
      <header className="dify-header">
        <h1>Flow Builder</h1>
        <div className="dify-actions">
          <button
            onClick={handleAddTask}
            className="dify-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加任务
          </button>
          <button
            onClick={() => setImportExportModalOpen(true)}
            className="dify-btn dify-btn-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            导入/导出
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="dify-btn dify-btn-secondary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${sidebarOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="dify-main">
        {/* 侧边栏 - 组件库和任务列表 */}
        <aside className="dify-sidebar">
          <div className="dify-section-title">组件库</div>
          <div className="dify-palette">
            <div className="dify-card" onClick={() => {
              if (activeTaskId) {
                useWorkflowStore.getState().addAction(
                  activeTaskId,
                  'builtin',
                  '内置动作',
                  100,
                  100
                );
              } else {
                alert('请先选择一个任务');
              }
            }}>
              <div className="dify-card-title">内置动作</div>
              <div className="dify-card-type">type: builtin</div>
            </div>
            <div className="dify-card" onClick={() => {
              if (activeTaskId) {
                useWorkflowStore.getState().addAction(
                  activeTaskId,
                  'cmd',
                  '命令执行',
                  100,
                  100
                );
              } else {
                alert('请先选择一个任务');
              }
            }}>
              <div className="dify-card-title">命令执行</div>
              <div className="dify-card-type">type: cmd</div>
            </div>
            <div className="dify-card" onClick={() => {
              if (activeTaskId) {
                useWorkflowStore.getState().addAction(
                  activeTaskId,
                  'http',
                  'HTTP 调用',
                  100,
                  100
                );
              } else {
                alert('请先选择一个任务');
              }
            }}>
              <div className="dify-card-title">HTTP 调用</div>
              <div className="dify-card-type">type: http</div>
            </div>
            <div className="dify-card" onClick={() => {
              if (activeTaskId) {
                useWorkflowStore.getState().addAction(
                  activeTaskId,
                  'wasm',
                  'WASM 动作',
                  100,
                  100
                );
              } else {
                alert('请先选择一个任务');
              }
            }}>
              <div className="dify-card-title">WASM 动作</div>
              <div className="dify-card-type">type: wasm</div>
            </div>
          </div>

          <div className="dify-section-title">画布工具</div>
          <div className="dify-tools">
            <button className="dify-btn dify-btn-secondary">
              自动排版
            </button>
            <button className="dify-btn dify-btn-secondary">
              清空画布
            </button>
          </div>

          <div className="dify-hint">提示：从组件库选择动作添加到画布；点击一个节点的引脚再点击目标节点可建立连线。</div>

          <div className="dify-section-title">任务列表</div>
          <div className="dify-list">
            {workflow.tasks.map(task => (
              <div
                key={task.id}
                onClick={() => setActiveTaskId(task.id)}
                className={`dify-list-item ${task.id === activeTaskId ? 'active' : ''}`}
              >
                <span>{task.name}</span>
                <button
                  className="dify-btn dify-btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('确认删除该任务及其所有动作？')) {
                      useWorkflowStore.getState().deleteTask(task.id);
                    }
                  }}
                >
                  删除
                </button>
              </div>
            ))}
            {workflow.tasks.length === 0 && (
              <div className="dify-hint">暂无任务，请点击"添加任务"按钮创建。</div>
            )}
          </div>

          <div className="dify-property-item" style={{ marginTop: '16px' }}>
            <label className="dify-property-label">新任务名称</label>
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className="dify-input"
              placeholder="输入任务名称"
            />
          </div>
        </aside>

        {/* 画布区域 */}
        <div className="dify-canvas-wrap">
          <div className="dify-canvas">
            <FlowBuilderCanvas />
          </div>
          <svg className="dify-wires"></svg>
          <div className="dify-status">就绪</div>
        </div>

        {/* 属性编辑侧边栏 */}
        {sidebarOpen && (
          <div className="dify-property-editor">
            <PropertyEditor />
          </div>
        )}
      </main>

      {/* 导入导出模态框 */}
      {importExportModalOpen && (
        <div className="dify-modal-overlay">
          <div className="dify-modal">
            <div className="dify-modal-header">
              <h3 className="dify-modal-title">导入/导出工作流</h3>
              <button
                onClick={() => setImportExportModalOpen(false)}
                className="dify-modal-close"
              >
                ×
              </button>
            </div>
            <div className="dify-modal-body">
              <div className="dify-tabs">
                <button
                  onClick={() => setImportExportFormat('json')}
                  className={`dify-tab ${importExportFormat === 'json' ? 'active' : ''}`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setImportExportFormat('yaml')}
                  className={`dify-tab ${importExportFormat === 'yaml' ? 'active' : ''}`}
                >
                  YAML
                </button>
              </div>
              <textarea
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                className="dify-code-editor"
                placeholder={`在此粘贴 ${importExportFormat.toUpperCase()} 内容进行导入，或留空进行导出`}
              ></textarea>
            </div>
            <div className="dify-modal-footer">
              <button
                onClick={() => setImportExportModalOpen(false)}
                className="dify-btn dify-btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                className="dify-btn"
              >
                导入
              </button>
              <button
                onClick={handleExport}
                className="dify-btn"
              >
                导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowBuilderDesigner;