import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

const useWorkflowStore = create((set, get) => ({
  // ── Stack State ─────────────────────────────────────
  currentStack: null,
  setCurrentStack: (stack) => set({ currentStack: stack }),

  // ── React Flow State ────────────────────────────────
  nodes: [],
  edges: [],
  selectedNode: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#6c63ff', strokeWidth: 2 },
        },
        state.edges
      ),
    })),

  setSelectedNode: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    set({ selectedNode: node || null });
  },

  clearSelection: () => set({ selectedNode: null }),

  // ── Node Management ─────────────────────────────────
  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
      selectedNode:
        state.selectedNode?.id === nodeId
          ? { ...state.selectedNode, data: { ...state.selectedNode.data, ...data } }
          : state.selectedNode,
    })),

  updateNodeConfig: (nodeId, config) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                config: { ...(n.data?.config || {}), ...config },
              },
            }
          : n
      ),
      selectedNode:
        state.selectedNode?.id === nodeId
          ? {
              ...state.selectedNode,
              data: {
                ...state.selectedNode.data,
                config: {
                  ...(state.selectedNode.data?.config || {}),
                  ...config,
                },
              },
            }
          : state.selectedNode,
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
      selectedNode:
        state.selectedNode?.id === nodeId ? null : state.selectedNode,
    })),

  // ── Chat State ──────────────────────────────────────
  chatMessages: [],
  isChatOpen: false,
  isChatLoading: false,

  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
  setIsChatLoading: (isLoading) => set({ isChatLoading: isLoading }),

  // ── Workflow Helpers ────────────────────────────────
  getWorkflowData: () => {
    const { nodes, edges } = get();
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: n.data,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })),
    };
  },

  loadWorkflow: (nodes, edges) =>
    set({
      nodes: nodes || [],
      edges: (edges || []).map((e) => ({
        ...e,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6c63ff', strokeWidth: 2 },
      })),
    }),

  clearWorkflow: () =>
    set({ nodes: [], edges: [], selectedNode: null, chatMessages: [] }),
}));

export default useWorkflowStore;
