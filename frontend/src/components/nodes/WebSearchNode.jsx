import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { HiOutlineGlobeAlt } from 'react-icons/hi2';
import './NodeStyles.css';

const WebSearchNode = memo(({ data, selected }) => {
  const config = data?.config || {};

  return (
    <div className={`custom-node node-websearch ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="query"
        className="handle handle-target"
        style={{ background: 'var(--node-websearch)' }}
      />
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(56, 189, 248, 0.15)' }}>
          <HiOutlineGlobeAlt size={18} color="var(--node-websearch)" />
        </div>
        <div className="node-title-group">
          <span className="node-title">Web Search</span>
          <span className="node-subtitle">
            {config.provider === 'brave' ? 'Brave Search' : 'SerpAPI'}
          </span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="context"
        className="handle handle-source"
        style={{ background: 'var(--node-websearch)' }}
      />
      <div className="node-port-labels">
        <span className="port-label port-label-left">Query</span>
        <span className="port-label port-label-right">Context</span>
      </div>
    </div>
  );
});

WebSearchNode.displayName = 'WebSearchNode';
export default WebSearchNode;
