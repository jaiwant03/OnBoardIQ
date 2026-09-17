import React, { useState, useEffect, useRef } from 'react';
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
  HelpCircle,
  Plus
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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

const Assistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello ${user?.name?.split(' ')[0] || 'there'}! I am OnboardIQ, your autonomous AI onboarding agent. I understand your role as a ${user?.role || 'team member'} in ${user?.department || 'the company'}.\n\nAsk me anything about company leave policies, required developer tooling, security compliance, or your daily roadmap milestones!`,
      agent: 'OnboardIQ Orchestrator',
      confidence: 'High',
      sources: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await aiAPI.getConversations();
      setConversations(res.data || []);
      if (res.data && res.data.length > 0 && !activeConversationId) {
        // Load the most recent conversation messages
        const latest = res.data[0];
        setActiveConversationId(latest._id);
        if (latest.messages && latest.messages.length > 0) {
          setMessages(latest.messages);
        }
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err);
    }
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

      if (res.data.conversationId && res.data.conversationId !== activeConversationId) {
        setActiveConversationId(res.data.conversationId);
        fetchConversations();
      }

      const aiResponse = {
        sender: 'assistant',
        text: res.data.response,
        agent: res.data.agent || 'OnboardIQ AI',
        confidence: res.data.confidence || 'High',
        sources: res.data.sources || [],
        reasoning: res.data.reasoning
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'AI Agent is currently unavailable. Please make sure Ollama is running (`ollama serve`).',
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

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([
      {
        sender: 'assistant',
        text: `Starting a fresh session! What question or task can I assist you with, ${user?.name?.split(' ')[0] || 'there'}?`,
        agent: 'OnboardIQ Orchestrator',
        confidence: 'High',
        sources: []
      }
    ]);
  };

  const handleClearChat = async () => {
    if (activeConversationId) {
      try {
        await aiAPI.clearConversation(activeConversationId);
        fetchConversations();
      } catch (err) {
        console.warn('Could not delete conversation:', err);
      }
    }
    handleNewChat();
  };

  const handleSelectConversation = (conv) => {
    setActiveConversationId(conv._id);
    if (conv.messages && conv.messages.length > 0) {
      setMessages(conv.messages);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '1rem' }}>
      <div className="assistant-container">
        {/* 1. Left: Conversation History Panel */}
        <div className="assistant-history-panel">
          <div className="history-header">
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              History
            </span>
            <button className="btn btn-secondary btn-sm" onClick={handleNewChat} title="New Chat">
              <Plus size={14} />
              <span>New</span>
            </button>
          </div>

          <div className="history-list">
            {conversations.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>
                No past sessions yet
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`history-item ${activeConversationId === conv._id ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <Bot size={14} />
                  <span>{conv.title || 'Conversation'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Center: Chat Message Area */}
        <div className="assistant-chat-panel">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div className="sidebar-logo-icon" style={{ width: 28, height: 28 }}>
                <Sparkles size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  OnboardIQ Intelligent Assistant
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)' }}>
                  Multi-Agent LangGraph with Source Verification
                </span>
              </div>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={handleClearChat}
              title="Clear active conversation"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="chat-messages-area">
            {messages.map((msg, idx) => {
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

                      {/* Source Verified Citations Card */}
                      {isAi && msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginTop: '0.85rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
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
            })}

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

          <div style={{ marginTop: 'auto', background: 'rgba(2, 132, 199, 0.06)', border: '1px solid rgba(2, 132, 199, 0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>
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
