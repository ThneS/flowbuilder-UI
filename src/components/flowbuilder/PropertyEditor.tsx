import React, { useState, useEffect } from 'react';
import useWorkflowStore from '../../state/workflowStore';

// 属性编辑器组件
const PropertyEditor: React.FC = () => {
  const { activeTaskId, actions, updateAction, workflow } = useWorkflowStore();
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
  };

  // 保存变更
  const saveChanges = () => {
    if (action) {
      updateAction(action.id, {
        ...action,
        ...formData,
      });
    }
  };

  if (!action) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500">
        <p>Select an action to edit its properties</p>
      </div>
    );
  }

  // 获取当前动作所属的任务
  const task = workflow.tasks.find(t => t.id === action.taskId);

  return (
    <div className="p-4 h-full flex flex-col bg-white border-l border-gray-200 w-full max-w-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Action Properties</h3>
        <div className="text-sm text-gray-500 mb-4">
          Task: {task?.name || 'Unknown'}
        </div>
      </div>

      <div className="space-y-4 flex-grow overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="builtin">Built-in</option>
            <option value="cmd">Command</option>
            <option value="http">HTTP Request</option>
            <option value="wasm">WebAssembly</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Parameters</label>
            <button
              onClick={addParameter}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              Add Parameter
            </button>
          </div>

          {Object.keys(formData.parameters).length === 0 ? (
            <p className="text-sm text-gray-500">No parameters defined</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(formData.parameters).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={key}
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    readOnly
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    className="w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() => deleteParameter(key)}
                    className="text-red-500 hover:text-red-700"
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

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
        <button
          onClick={saveChanges}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default PropertyEditor;