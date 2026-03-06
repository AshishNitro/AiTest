import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { HiOutlineComputerDesktop } from 'react-icons/hi2';
import './NodeStyles.css';

const OutputNode = memo(({ data, selected }) => {
  return (
    <div className={`custom-node node-output ${selected ? 'selected' : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        id="output"
        className="handle handle-target"
        style={{ background: 'var(--node-output)' }}
      />
      <div className="node-header">
        <div className="node-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
          <HiOutlineComputerDesktop size={18} color="var(--node-output)" />
        </div>
        <div className="node-title-group">
          <span className="node-title">Output</span>
          <span className="node-subtitle">Display results as text</span>
        </div>
      </div>
      <div className="node-port-labels">
        <span className="port-label port-label-left">Output Text</span>
      </div>
    </div>
  );
});

OutputNode.displayName = 'OutputNode';
export default OutputNode;
