import yaml from 'js-yaml';
import useWorkflowStore from '../state/workflowStore';
import type { Action, Task, WorkflowState } from '../state/workflowStore';

// 导出工作流为JSON
export const exportWorkflowToJson = (): string => {
  const { workflow, actions } = useWorkflowStore.getState();

  // 转换 Map 为普通对象
  const actionsObj = Object.fromEntries(actions.entries());

  const exportData = {
    workflow,
    actions: actionsObj,
  };

  return JSON.stringify(exportData, null, 2);
};

// 导出工作流为YAML
export const exportWorkflowToYaml = (): string => {
  const { workflow, actions } = useWorkflowStore.getState();

  // 转换 Map 为普通对象
  const actionsObj = Object.fromEntries(actions.entries());

  const exportData = {
    workflow,
    actions: actionsObj,
  };

  return yaml.dump(exportData);
};

// 从JSON导入工作流
export const importWorkflowFromJson = (jsonStr: string): void => {
  try {
    const importData = JSON.parse(jsonStr);
    const { workflow, actions } = importData;

    // 转换普通对象为 Map，并确保类型正确
    const actionsMap = new Map<string, Action>(Object.entries(actions || {} as Record<string, Action>));

    useWorkflowStore.setState({
      workflow: workflow || {
        version: '1.0',
        env: {},
        vars: {},
        tasks: [],
      },
      actions: actionsMap,
      activeTaskId: workflow?.tasks.length ? workflow.tasks[0].id : null,
      linkingFrom: null,
    });
  } catch (error) {
    console.error('Failed to import workflow from JSON:', error);
    throw new Error('Invalid JSON format');
  }
};

// 从YAML导入工作流
export const importWorkflowFromYaml = (yamlStr: string): void => {
  try {
    const importData = yaml.load(yamlStr) as any;
    const { workflow, actions } = importData;

    // 转换普通对象为 Map，并确保类型正确
    const actionsMap = new Map<string, Action>(Object.entries(actions || {} as Record<string, Action>));

    useWorkflowStore.setState({
      workflow: workflow || {
        version: '1.0',
        env: {},
        vars: {},
        tasks: [],
      },
      actions: actionsMap,
      activeTaskId: workflow?.tasks.length ? workflow.tasks[0].id : null,
      linkingFrom: null,
    });
  } catch (error) {
    console.error('Failed to import workflow from YAML:', error);
    throw new Error('Invalid YAML format');
  }
};

// 验证工作流配置
export const validateWorkflow = (): { valid: boolean; errors: string[] } => {
  const { workflow, actions } = useWorkflowStore.getState();
  const errors: string[] = [];

  // 验证任务
  workflow.tasks.forEach(task => {
    if (!task.name || task.name.trim() === '') {
      errors.push(`Task "${task.id}" has no name`);
    }

    // 验证动作
    task.actions.forEach(actionId => {
      const action = actions.get(actionId);
      if (!action) {
        errors.push(`Task "${task.id}" references non-existent action "${actionId}"`);
        return;
      }

      if (!action.type) {
        errors.push(`Action "${actionId}" has no type`);
      }

      // 验证流程配置
      if (action.flow.next && !actions.has(action.flow.next)) {
        errors.push(`Action "${actionId}" references non-existent next action "${action.flow.next}"`);
      }

      if (action.flow.next_if && !actions.has(action.flow.next_if)) {
        errors.push(`Action "${actionId}" references non-existent next_if action "${action.flow.next_if}"`);
      }

      // 验证重试配置
      if (action.flow.retry) {
        const retry = action.flow.retry;
        if (!['fixed', 'exponential'].includes(retry.strategy)) {
          errors.push(`Action "${actionId}" has invalid retry strategy: "${retry.strategy}"`);
        }
        if (retry.max_attempts < 1) {
          errors.push(`Action "${actionId}" has invalid max_attempts: ${retry.max_attempts}`);
        }
        if (retry.delay < 0) {
          errors.push(`Action "${actionId}" has invalid delay: ${retry.delay}`);
        }
      }

      // 验证超时配置
      if (action.flow.timeout) {
        const timeout = action.flow.timeout;
        if (timeout.duration < 0) {
          errors.push(`Action "${actionId}" has invalid timeout duration: ${timeout.duration}`);
        }
        if (timeout.on_timeout && !actions.has(timeout.on_timeout)) {
          errors.push(`Action "${actionId}" references non-existent on_timeout action "${timeout.on_timeout}"`);
        }
      }
    });
  });

  return { valid: errors.length === 0, errors };
};