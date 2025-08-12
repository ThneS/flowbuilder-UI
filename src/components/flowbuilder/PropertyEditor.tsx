import React, { useState, useEffect } from 'react';
import useWorkflowStore from '../../state/workflowStore';

// 属性编辑器组件
const PropertyEditor: React.FC = () => {
  const { activeTaskId, actions, updateAction, workflow } = useWorkflowStore();
  const [isFormModified, setIsFormModified] = useState(false);
  const [action, setAction] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    type: 'builtin',
    parameters: {},
  });

  // 监听选中的动作变化
  useEffect(() => {
    if (activeTaskId && actions.has(activeTaskId)) {
      const selectedAction = actions.get(activeTaskId);
      setAction(selectedAction);
      setFormData({
        name: selectedAction.name || '',
        description: selectedAction.description || '',
        type: selectedAction.type || 'builtin',
        parameters: selectedAction.parameters || {},
      });
    } else {
      setAction(null);
      setFormData({
        name: '',
        description: '',
        type: 'builtin',
        parameters: {},
      });
    }
  }, [activeTaskId, actions]);

  // 处理表单变更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setIsFormModified(true);
  };

  // 处理参数变更
  const handleParamChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [key]: value,
      },
    }));
  };

  // 添加参数
  const addParameter = () => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [`param_${Object.keys(prev.parameters).length + 1}`]: '',
      },
    }));
    setIsFormModified(true);
  };

  // 删除参数
  const deleteParameter = (key: string) => {
    setFormData(prev => {
      const { [key]: _, ...rest } = prev.parameters;
      return {
        ...prev,
        parameters: rest,
      };
    });
    setIsFormModified(true);
  };

  // 保存变更
  const saveChanges = () => {
    if (action) {
      updateAction(action.id, {
        ...action,
        ...formData,
      });
      setIsFormModified(false);
    }
  };

  // 取消变更
  const cancelChanges = () => {
    if (action) {
      setFormData({
        name: action.name || '',
        description: action.description || '',
        type: action.type || 'builtin',
        parameters: action.parameters || {},
      });
      setIsFormModified(false);
    }
  };

  if (!action) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500">选择一个动作以编辑其属性</p>
        </div>
      </div>
    );
  }

  // 获取当前动作所属的任务
  const task = workflow.tasks.find(t => t.id === action.taskId);

  return (
    <div className="p-5 h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 w-full max-w-md dify-property-editor">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">动作属性</h3>
          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
            {task?.name || '未知任务'}
          </span>
        </div>
      </div>

      <div className="space-y-4 flex-grow overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="builtin">内置动作</option>
            <option value="cmd">命令执行</option>
            <option value="http">HTTP请求</option>
            <option value="wasm">WebAssembly</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">参数</label>
          <button
            onClick={addParameter}
            className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
          >
            添加参数
          </button>
        </div>

          {Object.keys(formData.parameters).length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 py-3 px-4 rounded-md text-center">无参数定义</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(formData.parameters).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <input
                      type="text"
                      value={key}
                      className="w-1/3 px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      readOnly
                    />
                  <input
                      type="text"
                      value={value}
                      onChange={(e) => handleParamChange(key, e.target.value)}
                      className="w-2/3 px-3 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  <button
                      onClick={() => deleteParameter(key)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        {isFormModified && (
          <div className="text-xs text-amber-500 bg-amber-50 px-2 py-1 rounded-full">
            有未保存的更改
          </div>
        )}
        <div className="flex space-x-2">
          <button
            onClick={cancelChanges}
            disabled={!isFormModified}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${isFormModified ? 'text-gray-600 border border-gray-200 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`}
          >
            取消
          </button>
          <button
            onClick={saveChanges}
            disabled={!isFormModified}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${isFormModified ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-100 text-blue-300 cursor-not-allowed'}`}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyEditor;