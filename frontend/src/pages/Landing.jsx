import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineCpuChip,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { stacksApi } from '../api/client';
import toast from 'react-hot-toast';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const [stacks, setStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newStackName, setNewStackName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadStacks = async () => {
    try {
      const { data } = await stacksApi.list();
      setStacks(data);
    } catch {
      toast.error('Failed to load stacks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStacks();
  }, []);

  const handleCreate = async () => {
    if (!newStackName.trim()) return;
    setCreating(true);
    try {
      const { data } = await stacksApi.create({ name: newStackName.trim() });
      navigate(`/editor/${data.id}`);
    } catch {
      toast.error('Failed to create stack');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, stackId) => {
    e.stopPropagation();
    if (!confirm('Delete this stack?')) return;
    try {
      await stacksApi.delete(stackId);
      setStacks((prev) => prev.filter((s) => s.id !== stackId));
      toast.success('Stack deleted');
    } catch {
      toast.error('Failed to delete stack');
    }
  };

  return (
    <div className="landing-page">
      {/* Background Effects */}
      <div className="landing-bg">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="logo">
          <HiOutlineSparkles size={28} color="var(--accent-primary)" />
          <span className="logo-text">PlanetAI</span>
        </div>
      </header>

      {/* Content */}
      <main className="landing-main">
        <div className="landing-hero animate-fadeIn">
          <h1>My Stacks</h1>
          <p>Create and manage your AI workflow pipelines</p>
        </div>

        <div className="stacks-grid">
          {/* Create New Card */}
          <div
            className="stack-card stack-card-new animate-fadeIn"
            onClick={() => setShowModal(true)}
          >
            <div className="new-stack-icon">
              <HiOutlinePlus size={32} />
            </div>
            <span className="new-stack-label">Create New Stack</span>
          </div>

          {/* Stack Cards */}
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="stack-card stack-card-skeleton animate-pulse">
                <div className="skeleton-title"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            ))
          ) : (
            stacks.map((stack, i) => (
              <div
                key={stack.id}
                className="stack-card animate-fadeIn"
                style={{ animationDelay: `${(i + 1) * 0.08}s` }}
                onClick={() => navigate(`/editor/${stack.id}`)}
              >
                <div className="stack-card-header">
                  <div className="stack-card-icon">
                    <HiOutlineCpuChip size={20} color="var(--accent-primary)" />
                  </div>
                  <button
                    className="btn btn-icon btn-ghost stack-delete-btn"
                    onClick={(e) => handleDelete(e, stack.id)}
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                </div>
                <h3 className="stack-card-name">{stack.name}</h3>
                <p className="stack-card-desc">
                  {stack.description || 'No description'}
                </p>
                <div className="stack-card-meta">
                  <HiOutlineClock size={12} />
                  <span>
                    {new Date(stack.updated_at).toLocaleDateString()}
                  </span>
                  <span className="meta-dot">•</span>
                  <span>{stack.nodes?.length || 0} nodes</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Stack</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="config-field">
                <label className="label">Stack Name</label>
                <input
                  type="text"
                  className="input"
                  value={newStackName}
                  onChange={(e) => setNewStackName(e.target.value)}
                  placeholder="My AI Workflow"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={!newStackName.trim() || creating}
              >
                {creating ? 'Creating...' : 'Create Stack'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
