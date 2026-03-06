import React, { useState, useRef, useEffect } from 'react';
import {
  HiOutlineXMark,
  HiOutlinePaperAirplane,
  HiOutlineTrash,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import useWorkflowStore from '../../store/workflowStore';
import { chatApi } from '../../api/client';
import toast from 'react-hot-toast';
import './ChatModal.css';

const ChatModal = () => {
  const {
    currentStack,
    chatMessages,
    isChatOpen,
    isChatLoading,
    setIsChatOpen,
    addChatMessage,
    setChatMessages,
    setIsChatLoading,
    getWorkflowData,
  } = useWorkflowStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      // Load chat history
      if (currentStack?.id) {
        chatApi.history(currentStack.id).then(({ data }) => {
          setChatMessages(data);
        }).catch(() => {});
      }
    }
  }, [isChatOpen]);

  if (!isChatOpen) return null;

  const handleSend = async () => {
    const query = input.trim();
    if (!query || isChatLoading || !currentStack) return;

    setInput('');
    addChatMessage({
      id: `temp-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    });
    setIsChatLoading(true);

    try {
      const workflow = getWorkflowData();
      const { data } = await chatApi.send(currentStack.id, {
        query,
        workflow,
      });

      addChatMessage(data);
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Failed to get response';
      toast.error(errMsg);
      addChatMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${errMsg}`,
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    if (!currentStack) return;
    try {
      await chatApi.clearHistory(currentStack.id);
      setChatMessages([]);
      toast.success('Chat history cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsChatOpen(false)}>
      <div
        className="chat-modal modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="chat-header modal-header">
          <div className="chat-header-info">
            <HiOutlineSparkles size={20} color="var(--accent-primary)" />
            <div>
              <h3>GenAI Stack Chat</h3>
              <span className="chat-stack-name">{currentStack?.name}</span>
            </div>
          </div>
          <div className="chat-header-actions">
            <button
              className="btn btn-icon btn-ghost"
              onClick={handleClearHistory}
              title="Clear history"
            >
              <HiOutlineTrash size={16} />
            </button>
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => setIsChatOpen(false)}
              title="Close"
            >
              <HiOutlineXMark size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <HiOutlineSparkles size={40} />
              </div>
              <h4>Start a conversation</h4>
              <p>Ask a question and let your AI workflow generate a response</p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`chat-message chat-message-${msg.role} animate-slideInUp`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="message-avatar">
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <p>{msg.content}</p>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="message-sources">
                    {msg.sources.map((src, j) => (
                      <span key={j} className="source-tag">📄 {src}</span>
                    ))}
                  </div>
                )}
                <span className="message-time">
                  {msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </span>
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="chat-message chat-message-assistant animate-slideInUp">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your message..."
              disabled={isChatLoading}
            />
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isChatLoading}
            >
              <HiOutlinePaperAirplane size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
