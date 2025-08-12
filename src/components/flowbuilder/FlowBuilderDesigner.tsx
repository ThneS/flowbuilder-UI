import React, { useState } from 'react';
import FlowBuilderCanvas from './FlowBuilderCanvas';
import PropertyEditor from './PropertyEditor';
import useWorkflowStore from '../../state/workflowStore';
import { exportWorkflowToJson, exportWorkflowToYaml, importWorkflowFromJson, importWorkflowFromYaml } from '../../utils/workflowUtils';

// 工作流设计器主组件
const FlowBuilderDesigner: React.FC = () => {
  const { addTask, workflow, setActiveTaskId } = useWorkflowStore();
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 py-3 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800">FlowBuilder</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => addTask('New Task')}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Task
            </button>
            <button
              onClick={() => setImportExportModalOpen(true)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import/Export
            </button>
          </div>
        </div>
        <div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform ${sidebarOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex flex-1 overflow-hidden">
        {/* 画布区域 */}
        <div className="flex-1 relative">
          <FlowBuilderCanvas />
        </div>

        {/* 属性编辑侧边栏 */}
        {sidebarOpen && (
          <div className="w-80 h-full border-l border-gray-200 bg-white flex-shrink-0 transition-all duration-300 ease-in-out">
            <PropertyEditor />
          </div>
        )}
      </main>

      {/* 任务列表底部栏 */}
      <footer className="bg-white border-t border-gray-200 py-2 px-4 flex items-center overflow-x-auto">
        <div className="flex space-x-2">
          {workflow.tasks.map(task => (
            <button
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${task.id === useWorkflowStore.getState().activeTaskId ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {task.name}
            </button>
          ))}
        </div>
      </footer>

      {/* 导入导出模态框 */}
      {importExportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Import/Export Workflow</h3>
              <button
                onClick={() => setImportExportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setImportExportFormat('json')}
                  className={`px-3 py-1 rounded-md text-sm ${importExportFormat === 'json' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  JSON
                </button>
                <button
                  onClick={() => setImportExportFormat('yaml')}
                  className={`px-3 py-1 rounded-md text-sm ${importExportFormat === 'yaml' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  YAML
                </button>
              </div>

              <textarea
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                placeholder={`Paste ${importExportFormat.toUpperCase()} content here for import, or leave empty for export`}
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div className="p-4 flex justify-end space-x-2">
              <button
                onClick={() => setImportExportModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
              >
                Import
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowBuilderDesigner;