import React from 'react';
import {
  HiOutlineChatBubbleLeft,
  HiOutlineBookOpen,
  HiOutlineCpuChip,
  HiOutlineComputerDesktop,
  HiOutlineGlobeAlt,
} from 'react-icons/hi2';
import './ComponentLibrary.css';

const componentTypes = [
  {
    type: 'userQuery',
    label: 'User Input',
    description: 'Entry point for user queries',
    icon: HiOutlineChatBubbleLeft,
    color: 'var(--node-query)',
    bgColor: 'rgba(108, 99, 255, 0.12)',
  },
  {
    type: 'knowledgeBase',
    label: 'Knowledge Base',
    description: 'Document context retrieval',
    icon: HiOutlineBookOpen,
    color: 'var(--node-knowledge)',
    bgColor: 'rgba(0, 212, 170, 0.12)',
  },
  {
    type: 'llmEngine',
    label: 'LLM Engine',
    description: 'AI language model',
    icon: HiOutlineCpuChip,
    color: 'var(--node-llm)',
    bgColor: 'rgba(245, 158, 11, 0.12)',
  },
  {
    type: 'webSearch',
    label: 'Web Search',
    description: 'Search the web for context',
    icon: HiOutlineGlobeAlt,
    color: 'var(--node-websearch)',
    bgColor: 'rgba(56, 189, 248, 0.12)',
  },
  {
    type: 'output',
    label: 'Output',
    description: 'Display final response',
    icon: HiOutlineComputerDesktop,
    color: 'var(--node-output)',
    bgColor: 'rgba(236, 72, 153, 0.12)',
  },
];

const ComponentLibrary = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="component-library">
      <div className="library-header">
        <h3>Components</h3>
        <span className="library-count">{componentTypes.length}</span>
      </div>

      <div className="library-list">
        {componentTypes.map((comp) => {
          const Icon = comp.icon;
          return (
            <div
              key={comp.type}
              className="library-item"
              draggable
              onDragStart={(e) => onDragStart(e, comp.type)}
            >
              <div
                className="library-item-icon"
                style={{ background: comp.bgColor }}
              >
                <Icon size={20} color={comp.color} />
              </div>
              <div className="library-item-info">
                <span className="library-item-label">{comp.label}</span>
                <span className="library-item-desc">{comp.description}</span>
              </div>
              <div className="library-item-drag-hint">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="3" r="1.5" />
                  <circle cx="11" cy="3" r="1.5" />
                  <circle cx="5" cy="8" r="1.5" />
                  <circle cx="11" cy="8" r="1.5" />
                  <circle cx="5" cy="13" r="1.5" />
                  <circle cx="11" cy="13" r="1.5" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      <div className="library-hint">
        <span>💡 Drag components onto the canvas to build your workflow</span>
      </div>
    </div>
  );
};

export default ComponentLibrary;
