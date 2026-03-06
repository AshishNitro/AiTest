import React, { useState, useRef } from 'react';
import {
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineDocumentArrowUp,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from 'react-icons/hi2';
import useWorkflowStore from '../../store/workflowStore';
import { documentsApi } from '../../api/client';
import toast from 'react-hot-toast';
import './ConfigPanel.css';

const ConfigPanel = () => {
  const { selectedNode, clearSelection, updateNodeConfig, updateNodeData, removeNode, currentStack } =
    useWorkflowStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!selectedNode) {
    return (
      <div className="config-panel config-panel-empty">
        <div className="empty-state">
          <div className="empty-icon">⚙️</div>
          <h4>No Component Selected</h4>
          <p>Click on a component in the canvas to configure it</p>
        </div>
      </div>
    );
  }

  const config = selectedNode.data?.config || {};
  const nodeType = selectedNode.type;

  const handleConfigChange = (key, value) => {
    updateNodeConfig(selectedNode.id, { [key]: value });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !currentStack) return;

    setUploading(true);
    try {
      const { data: doc } = await documentsApi.upload(currentStack.id, file);
      const docs = selectedNode.data?.documents || [];
      updateNodeData(selectedNode.id, { documents: [...docs, doc] });
      toast.success(`Uploaded: ${file.name}`);

      // Auto-process if API key is set
      if (config.apiKey) {
        setProcessing(true);
        try {
          await documentsApi.process(currentStack.id, doc.id, {
            api_key: config.apiKey,
            embedding_model: config.embeddingModel || 'text-embedding-3-small',
            provider: config.provider || 'openai',
          });
          updateNodeData(selectedNode.id, {
            documents: [...docs, { ...doc, status: 'processed' }],
          });
          toast.success(`Processed: ${file.name}`);
        } catch (error) {
          toast.error('Failed to process document');
        } finally {
          setProcessing(false);
        }
      }
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const renderConfig = () => {
    switch (nodeType) {
      case 'userQuery':
        return (
          <div className="config-section">
            <div className="config-info-box">
              <span className="info-icon">💡</span>
              <p>This component accepts user queries and passes them to connected components. No configuration needed.</p>
            </div>
          </div>
        );

      case 'knowledgeBase':
        return (
          <>
            <div className="config-section">
              <h4 className="config-section-title">Embedding Settings</h4>
              <div className="config-field">
                <label className="label">Provider</label>
                <select
                  className="select"
                  value={config.provider || 'openai'}
                  onChange={(e) => handleConfigChange('provider', e.target.value)}
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>
              <div className="config-field">
                <label className="label">Embedding Model</label>
                <select
                  className="select"
                  value={config.embeddingModel || 'text-embedding-3-small'}
                  onChange={(e) => handleConfigChange('embeddingModel', e.target.value)}
                >
                  {config.provider === 'gemini' ? (
                    <>
                      <option value="models/text-embedding-004">text-embedding-004</option>
                    </>
                  ) : (
                    <>
                      <option value="text-embedding-3-small">text-embedding-3-small</option>
                      <option value="text-embedding-3-large">text-embedding-3-large</option>
                      <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                    </>
                  )}
                </select>
              </div>
              <div className="config-field">
                <label className="label">API Key</label>
                <div className="input-with-toggle">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="input"
                    value={config.apiKey || ''}
                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                    placeholder="Enter API key..."
                  />
                  <button
                    className="toggle-visibility"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h4 className="config-section-title">Documents</h4>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-secondary upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || processing}
              >
                <HiOutlineDocumentArrowUp size={16} />
                {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload PDF'}
              </button>
              {(selectedNode.data?.documents || []).length > 0 && (
                <div className="doc-list">
                  {selectedNode.data.documents.map((doc, i) => (
                    <div key={doc.id || i} className="doc-item">
                      <span className="doc-name">{doc.filename}</span>
                      <span className={`doc-status status-${doc.status}`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        );

      case 'llmEngine':
        return (
          <>
            <div className="config-section">
              <h4 className="config-section-title">Model Settings</h4>
              <div className="config-field">
                <label className="label">Provider</label>
                <select
                  className="select"
                  value={config.provider || 'openai'}
                  onChange={(e) => handleConfigChange('provider', e.target.value)}
                >
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Google Gemini</option>
                </select>
              </div>
              <div className="config-field">
                <label className="label">Model</label>
                <select
                  className="select"
                  value={config.model || 'gpt-4o-mini'}
                  onChange={(e) => handleConfigChange('model', e.target.value)}
                >
                  {config.provider === 'gemini' ? (
                    <>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                </select>
              </div>
              <div className="config-field">
                <label className="label">API Key</label>
                <div className="input-with-toggle">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="input"
                    value={config.apiKey || ''}
                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                    placeholder="Enter API key..."
                  />
                  <button
                    className="toggle-visibility"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
                  </button>
                </div>
              </div>
              <div className="config-field">
                <label className="label">Temperature: {config.temperature || 0.7}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature || 0.7}
                  onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                  className="range-slider"
                />
                <div className="range-labels">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>

            <div className="config-section">
              <h4 className="config-section-title">Prompt Template</h4>
              <div className="config-field">
                <textarea
                  className="textarea"
                  rows={5}
                  value={config.promptTemplate || ''}
                  onChange={(e) => handleConfigChange('promptTemplate', e.target.value)}
                  placeholder="You are a helpful assistant. Use the following context to answer. \n\nContext: {context}\n\nQuestion: {query}"
                />
                <div className="config-hint">
                  Use <code>{'{context}'}</code> and <code>{'{query}'}</code> as placeholders
                </div>
              </div>
            </div>

            <div className="config-section">
              <h4 className="config-section-title">Web Search (Optional)</h4>
              <div className="config-field">
                <label className="toggle-field">
                  <input
                    type="checkbox"
                    checked={config.enableWebSearch || false}
                    onChange={(e) => handleConfigChange('enableWebSearch', e.target.checked)}
                  />
                  <span className="toggle-label">Enable Web Search</span>
                </label>
              </div>
              {config.enableWebSearch && (
                <>
                  <div className="config-field">
                    <label className="label">Search Provider</label>
                    <select
                      className="select"
                      value={config.webSearchProvider || 'serpapi'}
                      onChange={(e) => handleConfigChange('webSearchProvider', e.target.value)}
                    >
                      <option value="serpapi">SerpAPI</option>
                      <option value="brave">Brave Search</option>
                    </select>
                  </div>
                  <div className="config-field">
                    <label className="label">Search API Key</label>
                    <input
                      type="password"
                      className="input"
                      value={config.webSearchApiKey || ''}
                      onChange={(e) => handleConfigChange('webSearchApiKey', e.target.value)}
                      placeholder="Enter search API key..."
                    />
                  </div>
                </>
              )}
            </div>
          </>
        );

      case 'webSearch':
        return (
          <div className="config-section">
            <h4 className="config-section-title">Search Settings</h4>
            <div className="config-field">
              <label className="label">Provider</label>
              <select
                className="select"
                value={config.provider || 'serpapi'}
                onChange={(e) => handleConfigChange('provider', e.target.value)}
              >
                <option value="serpapi">SerpAPI</option>
                <option value="brave">Brave Search</option>
              </select>
            </div>
            <div className="config-field">
              <label className="label">API Key</label>
              <div className="input-with-toggle">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="input"
                  value={config.apiKey || ''}
                  onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                  placeholder="Enter search API key..."
                />
                <button
                  className="toggle-visibility"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <HiOutlineEyeSlash size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
            </div>
          </div>
        );

      case 'output':
        return (
          <div className="config-section">
            <div className="config-info-box">
              <span className="info-icon">📤</span>
              <p>This component displays the final response from the LLM Engine in the chat interface. Connect it to receive output.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const nodeLabels = {
    userQuery: 'User Input',
    knowledgeBase: 'Knowledge Base',
    llmEngine: 'LLM Engine',
    webSearch: 'Web Search',
    output: 'Output',
  };

  return (
    <div className="config-panel animate-slideInRight">
      <div className="config-panel-header">
        <h3>{nodeLabels[nodeType] || 'Configuration'}</h3>
        <div className="config-panel-actions">
          <button
            className="btn btn-icon btn-ghost"
            onClick={() => {
              removeNode(selectedNode.id);
              clearSelection();
            }}
            title="Delete component"
          >
            <HiOutlineTrash size={16} color="var(--accent-danger)" />
          </button>
          <button className="btn btn-icon btn-ghost" onClick={clearSelection} title="Close">
            <HiOutlineXMark size={16} />
          </button>
        </div>
      </div>
      <div className="config-panel-body">{renderConfig()}</div>
    </div>
  );
};

export default ConfigPanel;
