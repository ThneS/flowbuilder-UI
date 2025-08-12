import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 定义数据模型
interface RetryConfig {
  strategy: 'fixed' | 'exponential';
  max_attempts: number;
  delay: number;
}

interface TimeoutConfig {
  duration: number;
  on_timeout?: string;
}

interface ActionFlow {
  next?: string | null;
  next_if?: string;
  retry?: RetryConfig;
  timeout?: TimeoutConfig;
}

interface Action {
  id: string;
  name: string;
  description?: string;
  type: 'builtin' | 'cmd' | 'http' | 'wasm';
  flow: ActionFlow;
  outputs?: Record<string, string>;
  parameters?: Record<string, any>;
  taskId: string;
  x: number;
  y: number;
}

interface Task {
  id: string;
  name: string;
  description?: string;
  actions: string[]; // action ids
}

interface WorkflowState {
  workflow: {
    version: string;
    env: Record<string, string>;
    vars: Record<string, string>;
    tasks: Task[];
  };
  actions: Map<string, Action>;
  activeTaskId: string | null;
  linkingFrom: string | null;
  seq: number;

  // 方法
  addTask: (name: string) => void;
  deleteTask: (taskId: string) => void;
  setActiveTaskId: (taskId: string | null) => void;
  addAction: (taskId: string, type: 'builtin' | 'cmd' | 'http' | 'wasm', name: string, x: number, y: number) => void;
  deleteAction: (actionId: string) => void;
  updateAction: (actionId: string, updates: Partial<Action>) => void;
  linkActions: (fromId: string, toId: string) => void;
  unlinkAction: (actionId: string) => void;
  generateUid: (prefix: string) => string;
}

// 创建 store
const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      workflow: {
        version: '1.0',
        env: {},
        vars: {},
        tasks: [],
      },
      actions: new Map(),
      activeTaskId: null,
      linkingFrom: null,
      seq: 1,

      generateUid: (prefix = 'n') => {
        const { seq } = get();
        set({ seq: seq + 1 });
        return `${prefix}${Date.now().toString(36)}${seq.toString(36)}`;
      },

      addTask: (name) => {
        const { workflow, generateUid } = get();
        const id = generateUid('task_');
        const newTask = { id, name, description: '', actions: [] };
        set({
          workflow: {
            ...workflow,
            tasks: [...workflow.tasks, newTask],
          },
          activeTaskId: id,
        });
      },

      deleteTask: (taskId) => {
        const { workflow, actions, activeTaskId } = get();
        // 删除任务
        const updatedTasks = workflow.tasks.filter(task => task.id !== taskId);
        // 删除相关动作
        const updatedActions = new Map(actions);
        workflow.tasks
          .find(task => task.id === taskId)?.actions
          .forEach(actionId => updatedActions.delete(actionId));
        // 如果删除的是当前活动任务，则设置为 null
        const newActiveTaskId = activeTaskId === taskId ? null : activeTaskId;

        set({
          workflow: { ...workflow, tasks: updatedTasks },
          actions: updatedActions,
          activeTaskId: newActiveTaskId,
        });
      },

      setActiveTaskId: (taskId) => {
        set({ activeTaskId: taskId });
      },

      addAction: (taskId, type, name, x, y) => {
        const { workflow, actions, generateUid } = get();
        const id = generateUid('act_');
        const newAction: Action = {
          id,
          taskId,
          name,
          type,
          description: '',
          flow: {},
          parameters: {},
          x,
          y,
        };

        // 更新任务的 actions 列表
        const updatedTasks = workflow.tasks.map(task =>
          task.id === taskId
            ? { ...task, actions: [...task.actions, id] }
            : task
        );

        set({
          workflow: { ...workflow, tasks: updatedTasks },
          actions: new Map(actions).set(id, newAction),
        });
      },

      deleteAction: (actionId) => {
        const { workflow, actions } = get();
        // 找到动作所属的任务
        const action = actions.get(actionId);
        if (!action) return;

        // 更新任务的 actions 列表
        const updatedTasks = workflow.tasks.map(task =>
          task.id === action.taskId
            ? { ...task, actions: task.actions.filter(id => id !== actionId) }
            : task
        );

        // 删除动作
        const updatedActions = new Map(actions);
        updatedActions.delete(actionId);

        set({
          workflow: { ...workflow, tasks: updatedTasks },
          actions: updatedActions,
        });
      },

      updateAction: (actionId, updates) => {
        const { actions } = get();
        const action = actions.get(actionId);
        if (!action) return;

        const updatedAction = { ...action, ...updates };
        set({
          actions: new Map(actions).set(actionId, updatedAction),
        });
      },

      linkActions: (fromId, toId) => {
        const { actions } = get();
        const fromAction = actions.get(fromId);
        if (!fromAction) return;

        set({
          actions: new Map(actions).set(fromId, {
            ...fromAction,
            flow: { ...fromAction.flow, next: toId },
          }),
          linkingFrom: null,
        });
      },

      unlinkAction: (actionId) => {
        const { actions } = get();
        const action = actions.get(actionId);
        if (!action) return;

        set({
          actions: new Map(actions).set(actionId, {
            ...action,
            flow: { ...action.flow, next: null },
          }),
        });
      },
    }),
    {
      name: 'flowbuilder-workflow-storage',
      partialize: (state) => ({
        workflow: state.workflow,
        actions: Array.from(state.actions.entries()),
        activeTaskId: state.activeTaskId,
        seq: state.seq,
      }),
      // 使用默认的localStorage存储
    }
  )
);

export default useWorkflowStore;