import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  HiOutlineArrowLeft,
  HiOutlineSparkles,
  HiOutlineBookmarkSquare,
  HiOutlinePlayCircle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

import UserQueryNode from '../components/nodes/UserQueryNode';
import KnowledgeBaseNode from '../components/nodes/KnowledgeBaseNode';
import LLMEngineNode from '../components/nodes/LLMEngineNode';
import OutputNode from '../components/nodes/OutputNode';
import WebSearchNode from '../components/nodes/WebSearchNode';
import ComponentLibrary from '../components/panels/ComponentLibrary';
import ConfigPanel from '../components/panels/ConfigPanel';
import ChatModal from '../components/chat/ChatModal';
import useWorkflowStore from '../store/workflowStore';
import { stacksApi, chatApi } from '../api/client';
import './Editor.css';

const nodeTypes = {
  userQuery: UserQueryNode,
  knowledgeBase: KnowledgeBaseNode,
  llmEngine: LLMEngineNode,
  output: OutputNode,
  webSearch: WebSearchNode,
};

const defaultConfigs = {
  userQuery: {},
  knowledgeBase: {
    provider: 'openai',
    embeddingModel: 'text-embedding-3-small',
    apiKey: '',
  },
  llmEngine: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: '',
    temperature: 0.7,
    promptTemplate: '',
    enableWebSearch: false,
  },
  webSearch: {
    provider: 'serpapi',
    apiKey: '',
  },
  output: {},
};

let nodeId = 0;
const getNodeId = () => `node_${Date.now()}_${nodeId++}`;

const EditorInner = () => {
  const { stackId } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const [saving, setSaving] = useState(false);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNode,
    clearSelection,
    addNode,
    loadWorkflow,
    getWorkflowData,
    currentStack,
    setCurrentStack,
    setIsChatOpen,
    isChatOpen,
  } = useWorkflowStore();

  // Load stack data
  useEffect(() => {
    const loadStack = async () => {
      try {
        const { data } = await stacksApi.get(stackId);
        setCurrentStack(data);
        loadWorkflow(data.nodes, data.edges);
      } catch {
        toast.error('Failed to load stack');
        navigate('/');
      }
    };
    loadStack();
  }, [stackId]);

  // Save workflow
  const handleSave = async () => {
    if (!currentStack) return;
    setSaving(true);
    try {
      const workflow = getWorkflowData();
      await stacksApi.update(currentStack.id, {
        nodes: workflow.nodes,
        edges: workflow.edges,
      });
      toast.success('Workflow saved!');
    } catch {
      toast.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  // Build Stack (validate)
  const handleBuildStack = async () => {
    if (!currentStack) return;

    // First save
    await handleSave();

    try {
      const { data } = await chatApi.validate(currentStack.id);
      if (data.is_valid) {
        toast.success('✅ Workflow is valid! Ready to chat.');
        setIsChatOpen(true);
      } else {
        data.errors.forEach((err) => toast.error(err));
        data.warnings.forEach((w) => toast(w, { icon: '⚠️' }));
      }
    } catch (error) {
      toast.error('Validation failed');
    }
  };

  // Drag & Drop
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getNodeId(),
        type,
        position,
        data: {
          label: type,
          config: { ...defaultConfigs[type] },
          documents: [],
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback(
    (_, node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return (
    <div className="editor-page">
      {/* Top Bar */}
      <header className="editor-top-bar">
        <div className="top-bar-left">
          <button className="btn btn-icon btn-ghost" onClick={() => navigate('/')}>
            <HiOutlineArrowLeft size={18} />
          </button>
          <div className="top-bar-title">
            <span className="top-bar-logo">
              <HiOutlineSparkles size={18} color="var(--accent-primary)" />
            </span>
            <h2>{currentStack?.name || 'Loading...'}</h2>
          </div>
        </div>
        <div className="top-bar-right">
          <button
            className="btn btn-secondary"
            onClick={handleSave}
            disabled={saving}
          >
            <HiOutlineBookmarkSquare size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            className="btn btn-success"
            onClick={handleBuildStack}
          >
            <HiOutlinePlayCircle size={16} />
            Build Stack
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsChatOpen(true)}
          >
            <HiOutlineSparkles size={16} />
            Chat with AI
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="editor-workspace">
        {/* Left Panel */}
        <div className="editor-sidebar-left">
          <ComponentLibrary />
        </div>

        {/* Canvas */}
        <div className="editor-canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#6c63ff', strokeWidth: 2 },
            }}
          >
            <Background
              variant="dots"
              gap={20}
              size={1}
              color="rgba(255,255,255,0.05)"
            />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const colors = {
                  userQuery: '#6c63ff',
                  knowledgeBase: '#00d4aa',
                  llmEngine: '#f59e0b',
                  output: '#ec4899',
                  webSearch: '#38bdf8',
                };
                return colors[node.type] || '#666';
              }}
              maskColor="rgba(15, 15, 35, 0.8)"
            />
          </ReactFlow>
        </div>

        {/* Right Panel */}
        <div className="editor-sidebar-right">
          <ConfigPanel />
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal />
    </div>
  );
};

const Editor = () => (
  <ReactFlowProvider>
    <EditorInner />
  </ReactFlowProvider>
);

export default Editor;
