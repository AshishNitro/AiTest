import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { HiOutlineChatBubbleLeft } from 'react-icons/hi2';
import './NodeStyles.css';

const UserQueryNode = memo(({ data, selected }) => {
  return (
    <div className={`custom-node node-query ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(108, 99, 255, 0.15)' }}>
          <HiOutlineChatBubbleLeft size={18} color="var(--node-query)" />
        </div>
        <div className="node-title-group">
          <span className="node-title">User Input</span>
          <span className="node-subtitle">Entry point for queries</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="query"
        className="handle handle-source"
        style={{ background: 'var(--node-query)' }}
      />
      <div className="node-port-labels">
        <span className="port-label port-label-right">Query</span>
      </div>
    </div>
  );
});

UserQueryNode.displayName = 'UserQueryNode';
export default UserQueryNode;
