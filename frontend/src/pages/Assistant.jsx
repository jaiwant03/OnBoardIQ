import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  Info,
  Plus,
  X,
  History,
  MessageSquare,
  Clock,
  ArrowRight
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import SourceCard from '../components/SourceCard';
import '../styles/assistant.css';

const SUGGESTED_PROMPTS = [
  'What should I complete today?',
  'What is the leave policy?',
  'What tools do I need to install?',
  'What should I learn next?',
  'Explain the security policy.',
  'What onboarding tasks are still pending?'
];

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const Assistant = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showHistory, setShowHistory } = useUI();

  const getWelcomeMessage = useCallback(
    () => ({
      sender: 'assistant',
      text: `Hello ${user?.name?.split(' ')[0] || 'there'}! I am OnboardIQ, your autonomous AI onboarding assistant. I understand your role as a ${user?.role || 'team member'} in ${user?.department || 'the company'}.\n\nAsk me anything about company leave policies, required developer tooling, security compliance, or your daily roadmap milestones!`,
      agent: 'OnboardIQ Orchestrator',
      confidence: 'High',
      sources: []
    }),
    [user]
  );

  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const initialQueryProcessed = useRef(false);

  // Initialize messages with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([getWelcomeMessage()]);
    }
  }, [getWelcomeMessage, messages.length]);

  // Fetch conversation history list on mount
  useEffect(() => {
    fetchConversations(true);
  }, []);

  // Handle incoming initialQuery from navigation state (e.g. from Onboarding or LearningPath)
  useEffect(() => {
    if (location.state?.initialQuery && !initialQueryProcessed.current) {
      initialQueryProcessed.current = true;
      const query = location.state.initialQuery;
      // Clear location state so refresh doesn't resend
      window.history.replaceState({}, document.title);
      // Start a fresh new chat session with this query
      handleNewChat();
      setTimeout(() => {
        handleSendMessage(query);
      }, 100);
    }
  }, [location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async (autoSelectLatest = false) => {
    try {
      const res = await aiAPI.getConversations();
      const list = res.data || [];
      setConversations(list);

      // On initial load without active conversation, load the most recent session
      if (autoSelectLatest && list.length > 0 && !activeConversationId) {
        const latest = list[0];
        loadConversation(latest._id);
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
    }
  };

  const loadConversation = async (convId) => {
    if (!convId) return;
    try {
      setLoadingChat(true);
      setActiveConversationId(convId);
      const res = await aiAPI.getConversation(convId);
      if (res.data?.messages && res.data.messages.length > 0) {
        setMessages(res.data.messages);
      } else {
        setMessages([getWelcomeMessage()]);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      // Fallback
      setActiveConversationId(convId);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSelectConversation = (convId) => {
    if (activeConversationId === convId || isTyping) return;
    loadConversation(convId);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([getWelcomeMessage()]);
    setInputQuery('');
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await aiAPI.clearConversation(convId);
      const updatedList = conversations.filter((c) => c._id !== convId);
      setConversations(updatedList);

      // If we deleted the active conversation, switch to the next one or start a new chat
      if (activeConversationId === convId) {
        if (updatedList.length > 0) {
          loadConversation(updatedList[0]._id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Could not delete conversation:', err);
    }
  };

  const handleClearChat = async () => {
    if (activeConversationId) {
      try {
        await aiAPI.clearConversation(activeConversationId);
        await fetchConversations();
      } catch (err) {
        console.warn('Could not clear conversation:', err);
      }
    }
    handleNewChat();
  };

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isTyping) return;

    const userMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const res = await aiAPI.chat({
        query: textToSend,
        conversationId: activeConversationId
      });

      const newConvoId = res.data.conversationId;
      if (newConvoId) {
        setActiveConversationId(newConvoId);
      }

      const aiResponse = {
        sender: 'assistant',
        text: res.data.response,
        agent: res.data.agent || 'OnboardIQ AI',
        confidence: res.data.confidence || 'High',
        sources: res.data.sources || [],
        reasoning: res.data.reasoning,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiResponse]);

      // Re-fetch conversation history so the updated title and latest chat appears at the top
      await fetchConversations(false);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'AI Agent is currently unavailable. Please make sure the AI service is running.',
          agent: 'System Monitor',
          confidence: 'Low',
          sources: []
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="page-container" style={{ paddingBottom: '1rem' }}>
      <div className={`assistant-container ${showHistory ? 'with-history' : 'large-view'}`}>
        {/* 1. Left: Conversation History Panel */}
        {showHistory && (
          <div className="assistant-history-panel animate-fade-in">
            <div className="history-header">
              <div className="history-header-title">
                <History size={16} color="var(--accent-primary)" />
                <span>Chat History</span>
                <span className="history-count-badge">{conversations.length}</span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowHistory(false)}
                title="Hide History Sidebar"
                style={{ padding: '0.25rem 0.4rem', color: 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Prominent "+ New Chat" Button */}
            <button
              className="btn-new-chat-primary"
              onClick={handleNewChat}
              title="Start a brand new chat session"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Chat</span>
            </button>

            {/* Conversation History List */}
            <div className="history-list">
              {conversations.length === 0 ? (
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginTop: '2.5rem',
                    padding: '0 0.5rem',
                    lineHeight: 1.5
                  }}
                >
                  <MessageSquare size={28} color="#CBD5E1" style={{ margin: '0 auto 0.5rem', opacity: 0.7 }} />
                  <div>No past sessions yet</div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                    Your conversations will be stored here automatically.
                  </div>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = activeConversationId === conv._id;
                  return (
                    <div
                      key={conv._id}
                      className={`history-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectConversation(conv._id)}
                      title={conv.title}
                    >
                      <div className="history-item-top">
                        <div className="history-title-wrap">
                          <Bot size={14} color={isActive ? '#00A884' : '#64748B'} style={{ flexShrink: 0 }} />
                          <span className="history-item-title">
                            {conv.title || 'New Conversation'}
                          </span>
                        </div>
                        <button
                          className="history-delete-btn"
                          onClick={(e) => handleDeleteConversation(conv._id, e)}
                          title="Delete this chat from history"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="history-item-meta">
                        <span className="history-timestamp">
                          {formatRelativeTime(conv.updatedAt || conv.createdAt)}
                        </span>
                        {conv.messageCount !== undefined && conv.messageCount > 0 && (
                          <span className="history-msg-badge">
                            {conv.messageCount} msgs
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. Center: Chat Message Area */}
        <div className="assistant-chat-panel">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="sidebar-logo-icon" style={{ width: 30, height: 30 }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  OnboardIQ Intelligent Assistant
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  Autonomous Multi-Agent with RAG Source Citations
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* "+ New Chat" Button in Header */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleNewChat}
                title="Start a new chat session"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
              >
                <Plus size={14} />
                <span>New Chat</span>
              </button>

              {/* Toggle History Button */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowHistory(!showHistory)}
                title={showHistory ? 'Hide history' : 'Show chat history'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  color: showHistory ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
              >
                <History size={14} />
                <span>History</span>
                {conversations.length > 0 && (
                  <span
                    style={{
                      background: 'rgba(0, 168, 132, 0.12)',
                      color: '#008769',
                      fontSize: '0.68rem',
                      padding: '0.05rem 0.35rem',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700
                    }}
                  >
                    {conversations.length}
                  </span>
                )}
              </button>

              {/* Clear Active Chat */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleClearChat}
                title="Clear current conversation"
              >
                <Trash2 size={14} />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="chat-messages-area">
            {loadingChat ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} />
                  <span>Loading conversation...</span>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isAi = msg.sender === 'assistant';
                return (
                  <div
                    key={idx}
                    className={`message-row ${isAi ? 'ai-row' : 'user-row'} animate-fade-in`}
                  >
                    <div className={`message-avatar ${isAi ? 'ai' : 'user'}`}>
                      {isAi ? <Sparkles size={16} /> : <User size={16} />}
                    </div>

                    <div className="message-content-box">
                      {isAi && (
                        <div className="agent-badge-tag">
                          <Sparkles size={12} />
                          <span>{msg.agent || 'Specialized Agent'}</span>
                          {msg.confidence && (
                            <span
                              className="badge badge-success"
                              style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
                            >
                              Confidence: {msg.confidence}
                            </span>
                          )}
                        </div>
                      )}

                      <div className={`message-bubble ${isAi ? 'ai-bubble' : 'user-bubble'}`}>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>

                        {/* Source Citations Card */}
                        {isAi && msg.sources && msg.sources.length > 0 && (
                          <div style={{ marginTop: '0.85rem' }}>
                            <div
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '0.4rem'
                              }}
                            >
                              Verified Source Citations ({msg.sources.length})
                            </div>
                            {msg.sources.map((src, sIdx) => (
                              <SourceCard key={sIdx} source={src} />
                            ))}
                          </div>
                        )}
                      </div>

                      {isAi && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                            onClick={() => handleCopy(msg.text, idx)}
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check size={12} color="var(--success)" />
                                <span style={{ color: 'var(--success)' }}>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isTyping && (
              <div className="message-row ai-row animate-fade-in">
                <div className="message-avatar ai">
                  <Sparkles size={16} />
                </div>
                <div className="message-bubble ai-bubble">
                  <div className="typing-indicator">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts Bar */}
          <div className="suggested-prompts-tray">
            {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
              <button
                key={pIdx}
                className="prompt-pill"
                onClick={() => handleSendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form
            className="chat-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              ref={chatInputRef}
              type="text"
              className="chat-input-box"
              placeholder="Ask anything about company policies, setup guides, or your tasks..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputQuery.trim() || isTyping}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        {/* 3. Right: Multi-Agent Context & Router Inspector */}
        <div className="assistant-context-panel">
          <div className="context-header">
            <ShieldCheck size={16} color="var(--accent-primary)" />
            <span>Multi-Agent Engine</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Queries are routed via LangGraph to specialized agent nodes grounded with ChromaDB vector search:
          </p>

          <div className="agent-spec-card">
            <div className="agent-spec-title">🛡️ HR Agent</div>
            <div className="agent-spec-desc">
              Annual leave, sick leave, benefits, office hours, and employee code of conduct.
            </div>
          </div>

          <div className="agent-spec-card">
            <div className="agent-spec-title">⚡ IT & Security Agent</div>
            <div className="agent-spec-desc">
              Software setup, Git SSH keys, VPN access, MFA configuration, and workstation security.
            </div>
          </div>

          <div className="agent-spec-card">
            <div className="agent-spec-title">🎓 Learning Agent</div>
            <div className="agent-spec-desc">
              Role-specific skill curriculums, architecture training, and recommended courses.
            </div>
          </div>

          <div className="agent-spec-card">
            <div className="agent-spec-title">🚀 Onboarding Agent</div>
            <div className="agent-spec-desc">
              Milestone roadmap, Next Best Action prioritization, and pending tasks tracking.
            </div>
          </div>

          <div
            style={{
              marginTop: 'auto',
              background: 'rgba(2, 132, 199, 0.06)',
              border: '1px solid rgba(2, 132, 199, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                marginBottom: '0.2rem'
              }}
            >
              <Info size={13} />
              <span>Anti-Hallucination Guard</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              If a query lacks matching company documentation, the system responds factually without guessing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
