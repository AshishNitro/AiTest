import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { HiOutlineBookOpen } from 'react-icons/hi2';
import './NodeStyles.css';

const KnowledgeBaseNode = memo(({ data, selected }) => {
  const config = data?.config || {};
  const docCount = data?.documents?.length || 0;

  return (
    <div className={`custom-node node-knowledge ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="query"
        className="handle handle-target"
        style={{ background: 'var(--node-knowledge)' }}
      />
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(0, 212, 170, 0.15)' }}>
          <HiOutlineBookOpen size={18} color="var(--node-knowledge)" />
        </div>
        <div className="node-title-group">
          <span className="node-title">Knowledge Base</span>
          <span className="node-subtitle">
            {docCount > 0 ? `${docCount} document${docCount > 1 ? 's' : ''}` : 'Upload documents'}
          </span>
        </div>
      </div>
      {config.embeddingModel && (
        <div className="node-config-preview">
          <span className="config-badge">{config.embeddingModel}</span>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="context"
        className="handle handle-source"
        style={{ background: 'var(--node-knowledge)' }}
      />
      <div className="node-port-labels">
        <span className="port-label port-label-left">Query</span>
        <span className="port-label port-label-right">Context</span>
      </div>
    </div>
  );
});

KnowledgeBaseNode.displayName = 'KnowledgeBaseNode';
export default KnowledgeBaseNode;
