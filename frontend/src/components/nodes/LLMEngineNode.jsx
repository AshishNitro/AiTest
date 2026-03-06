import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { HiOutlineCpuChip } from 'react-icons/hi2';
import './NodeStyles.css';

const LLMEngineNode = memo(({ data, selected }) => {
  const config = data?.config || {};

  return (
    <div className={`custom-node node-llm ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="query"
        className="handle handle-target"
        style={{ background: 'var(--node-llm)', top: '35%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="context"
        className="handle handle-target"
        style={{ background: 'var(--node-knowledge)', top: '65%' }}
      />
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
          <HiOutlineCpuChip size={18} color="var(--node-llm)" />
        </div>
        <div className="node-title-group">
          <span className="node-title">LLM Engine</span>
          <span className="node-subtitle">
            {config.provider === 'gemini' ? 'Google Gemini' : 'OpenAI'}
          </span>
        </div>
      </div>
      {config.model && (
        <div className="node-config-preview">
          <span className="config-badge">{config.model}</span>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="response"
        className="handle handle-source"
        style={{ background: 'var(--node-llm)' }}
      />
      <div className="node-port-labels">
        <span className="port-label port-label-left" style={{ top: '30%' }}>Query</span>
        <span className="port-label port-label-left" style={{ top: '60%' }}>Context</span>
        <span className="port-label port-label-right">Response</span>
      </div>
    </div>
  );
});

LLMEngineNode.displayName = 'LLMEngineNode';
export default LLMEngineNode;
