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
  Search,
  Edit3,
  PanelLeftClose,
  PanelLeft,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useNotification } from '../context/NotificationContext';
import SourceCard from '../components/SourceCard';
import '../styles/assistant.css';

const SUGGESTED_PROMPTS = [
  {
    title: 'What should I complete today?',
    category: 'Onboarding Tasks',
    icon: '🚀'
  },
  {
    title: 'What is the company leave policy?',
    category: 'HR & Benefits',
    icon: '🏖️'
  },
  {
    title: 'What developer tools do I need to install?',
    category: 'IT & Security',
    icon: '💻'
  },
  {
    title: 'What should I learn next in my curriculum?',
    category: 'Learning Path',
    icon: '🎓'
  }
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

// Group conversations by ChatGPT/Gemini time buckets
const groupConversations = (list) => {
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    previous30Days: [],
    older: []
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOf7Days = startOfToday - 6 * 86400000;
  const startOf30Days = startOfToday - 29 * 86400000;

  list.forEach((conv) => {
    const timestamp = new Date(conv.updatedAt || conv.createdAt || Date.now()).getTime();
    if (timestamp >= startOfToday) {
      groups.today.push(conv);
    } else if (timestamp >= startOfYesterday) {
      groups.yesterday.push(conv);
    } else if (timestamp >= startOf7Days) {
      groups.previous7Days.push(conv);
    } else if (timestamp >= startOf30Days) {
      groups.previous30Days.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
};

const Assistant = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { showHistory, setShowHistory } = useUI();
  const { addNotification } = useNotification();

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
  const [searchQuery, setSearchQuery] = useState('');

  // Inline rename state
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitleText, setEditTitleText] = useState('');

  // Multi-Agent Engine Drawer state
  const [showAgentDrawer, setShowAgentDrawer] = useState(false);

  // Clear confirmation modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const initialQueryProcessed = useRef(false);

  // Initialize messages with welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([getWelcomeMessage()]);
    }
  }, [getWelcomeMessage, messages.length]);

  // Load cached conversations on mount for instantaneous rendering
  useEffect(() => {
    if (user?._id) {
      const cached = localStorage.getItem(`onboardiq_convos_${user._id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConversations(parsed);
          }
        } catch (e) {
          console.warn('Failed parsing conversation cache:', e);
        }
      }
    }
  }, [user?._id]);

  // Fetch conversation history list on mount (do NOT auto-select last conversation, open fresh chat like ChatGPT/Gemini)
  useEffect(() => {
    fetchConversations(false);
  }, []);

  // Keyboard shortcut: Ctrl+Shift+O to start new chat
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  // Handle incoming initialQuery from navigation state or Global Search URL ?q=
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryFromUrl = searchParams.get('q');
    const queryFromState = location.state?.initialQuery;
    const query = queryFromUrl || queryFromState;

    if (query && !initialQueryProcessed.current) {
      initialQueryProcessed.current = true;
      // Clear URL params / location state so refresh doesn't resend
      window.history.replaceState({}, document.title, window.location.pathname);
      // Start a fresh new chat session with this query
      handleNewChat();
      setTimeout(() => {
        handleSendMessage(query);
      }, 150);
    }
  }, [location.state, location.search]);

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

      // Cache locally
      if (user?._id) {
        localStorage.setItem(`onboardiq_convos_${user._id}`, JSON.stringify(list));
      }

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
      setActiveConversationId(convId);
    } finally {
      setLoadingChat(false);
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 50);
    }
  };

  const handleSelectConversation = (convId) => {
    if (activeConversationId === convId || isTyping) return;
    loadConversation(convId);
  };

  // Start a new chat session WITHOUT wiping or losing past conversations
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([getWelcomeMessage()]);
    setInputQuery('');
    setEditingConvId(null);
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 50);
  };

  const handleStartRename = (conv, e) => {
    e?.stopPropagation();
    setEditingConvId(conv._id);
    setEditTitleText(conv.title || '');
  };

  const handleSaveRename = async (convId, e) => {
    e?.stopPropagation();
    if (!editTitleText.trim()) {
      setEditingConvId(null);
      return;
    }
    try {
      const trimmed = editTitleText.trim();
      await aiAPI.updateConversation(convId, { title: trimmed });
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, title: trimmed } : c))
      );
      if (user?._id) {
        const updated = conversations.map((c) =>
          c._id === convId ? { ...c, title: trimmed } : c
        );
        localStorage.setItem(`onboardiq_convos_${user._id}`, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Could not rename conversation:', err);
    } finally {
      setEditingConvId(null);
    }
  };

  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setEditingConvId(null);
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await aiAPI.clearConversation(convId);
      const updatedList = conversations.filter((c) => c._id !== convId);
      setConversations(updatedList);
      if (user?._id) {
        localStorage.setItem(`onboardiq_convos_${user._id}`, JSON.stringify(updatedList));
      }

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

  const handleClearCurrentChat = async () => {
    setShowClearConfirm(false);
    if (activeConversationId) {
      try {
        await aiAPI.clearConversation(activeConversationId);
        const updatedList = conversations.filter((c) => c._id !== activeConversationId);
        setConversations(updatedList);
        if (user?._id) {
          localStorage.setItem(`onboardiq_convos_${user._id}`, JSON.stringify(updatedList));
        }
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

      addNotification({
        title: 'AI Mentor Response Ready 🤖',
        message: `Answered: "${textToSend.slice(0, 45)}${textToSend.length > 45 ? '...' : ''}" with verified policy sources.`,
        type: 'assistant',
        link: '/assistant'
      });

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filter conversations by search term
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.preview && c.preview.toLowerCase().includes(q))
    );
  });

  const grouped = groupConversations(filteredConversations);

  const activeConv = conversations.find((c) => c._id === activeConversationId);
  const activeTitle = activeConv?.title || (activeConversationId ? 'Conversation' : 'New Chat');

  // Check if we are in empty / new chat state (only initial welcome message)
  const isFreshChat =
    messages.length <= 1 &&
    (!messages[0] || messages[0].sender === 'assistant');

  return (
    <div className="assistant-page-root">
      <div className={`assistant-app-layout ${showHistory ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        
        {/* =========================================================================
            1. LEFT CHAT HISTORY SIDEBAR (ChatGPT / Gemini style)
           ========================================================================= */}
        <aside className="assistant-history-sidebar">
          {/* Sidebar Top: Branding & Close Toggle */}
          <div className="history-sidebar-top">
            <div className="history-sidebar-title">
              <History size={16} className="history-title-icon" />
              <span>Chat History</span>
              <span className="history-pill-count">{conversations.length}</span>
            </div>
            <button
              className="history-toggle-close-btn"
              onClick={() => setShowHistory(false)}
              title="Close history sidebar"
            >
              <PanelLeftClose size={17} />
            </button>
          </div>

          {/* Prominent "+ New Chat" Button */}
          <div className="new-chat-btn-wrapper">
            <button
              className="btn-new-chat-gemini"
              onClick={handleNewChat}
              title="Start a new chat session"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Chat</span>
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="history-search-container">
            <Search size={14} className="history-search-icon" />
            <input
              type="text"
              className="history-search-input"
              placeholder="Search past chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="history-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Grouped Conversation Thread List */}
          <div className="history-scroll-area custom-scrollbar">
            {conversations.length === 0 ? (
              <div className="history-empty-state">
                <MessageSquare size={32} className="history-empty-icon" />
                <div className="history-empty-title">No conversations yet</div>
                <div className="history-empty-desc">
                  Your chat threads will automatically be saved and organized here.
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="history-empty-state">
                <Search size={28} className="history-empty-icon" />
                <div className="history-empty-title">No matching chats</div>
                <div className="history-empty-desc">
                  Try searching for a different keyword or topic.
                </div>
              </div>
            ) : (
              <>
                {/* 1. TODAY */}
                {grouped.today.length > 0 && (
                  <div className="history-group">
                    <div className="history-group-header">Today</div>
                    {grouped.today.map((conv) => (
                      <HistoryItem
                        key={conv._id}
                        conv={conv}
                        isActive={activeConversationId === conv._id}
                        isEditing={editingConvId === conv._id}
                        editTitleText={editTitleText}
                        setEditTitleText={setEditTitleText}
                        onSelect={() => handleSelectConversation(conv._id)}
                        onStartRename={(e) => handleStartRename(conv, e)}
                        onSaveRename={(e) => handleSaveRename(conv._id, e)}
                        onCancelRename={handleCancelRename}
                        onDelete={(e) => handleDeleteConversation(conv._id, e)}
                      />
                    ))}
                  </div>
                )}

                {/* 2. YESTERDAY */}
                {grouped.yesterday.length > 0 && (
                  <div className="history-group">
                    <div className="history-group-header">Yesterday</div>
                    {grouped.yesterday.map((conv) => (
                      <HistoryItem
                        key={conv._id}
                        conv={conv}
                        isActive={activeConversationId === conv._id}
                        isEditing={editingConvId === conv._id}
                        editTitleText={editTitleText}
                        setEditTitleText={setEditTitleText}
                        onSelect={() => handleSelectConversation(conv._id)}
                        onStartRename={(e) => handleStartRename(conv, e)}
                        onSaveRename={(e) => handleSaveRename(conv._id, e)}
                        onCancelRename={handleCancelRename}
                        onDelete={(e) => handleDeleteConversation(conv._id, e)}
                      />
                    ))}
                  </div>
                )}

                {/* 3. PREVIOUS 7 DAYS */}
                {grouped.previous7Days.length > 0 && (
                  <div className="history-group">
                    <div className="history-group-header">Previous 7 Days</div>
                    {grouped.previous7Days.map((conv) => (
                      <HistoryItem
                        key={conv._id}
                        conv={conv}
                        isActive={activeConversationId === conv._id}
                        isEditing={editingConvId === conv._id}
                        editTitleText={editTitleText}
                        setEditTitleText={setEditTitleText}
                        onSelect={() => handleSelectConversation(conv._id)}
                        onStartRename={(e) => handleStartRename(conv, e)}
                        onSaveRename={(e) => handleSaveRename(conv._id, e)}
                        onCancelRename={handleCancelRename}
                        onDelete={(e) => handleDeleteConversation(conv._id, e)}
                      />
                    ))}
                  </div>
                )}

                {/* 4. PREVIOUS 30 DAYS */}
                {grouped.previous30Days.length > 0 && (
                  <div className="history-group">
                    <div className="history-group-header">Previous 30 Days</div>
                    {grouped.previous30Days.map((conv) => (
                      <HistoryItem
                        key={conv._id}
                        conv={conv}
                        isActive={activeConversationId === conv._id}
                        isEditing={editingConvId === conv._id}
                        editTitleText={editTitleText}
                        setEditTitleText={setEditTitleText}
                        onSelect={() => handleSelectConversation(conv._id)}
                        onStartRename={(e) => handleStartRename(conv, e)}
                        onSaveRename={(e) => handleSaveRename(conv._id, e)}
                        onCancelRename={handleCancelRename}
                        onDelete={(e) => handleDeleteConversation(conv._id, e)}
                      />
                    ))}
                  </div>
                )}

                {/* 5. OLDER */}
                {grouped.older.length > 0 && (
                  <div className="history-group">
                    <div className="history-group-header">Older</div>
                    {grouped.older.map((conv) => (
                      <HistoryItem
                        key={conv._id}
                        conv={conv}
                        isActive={activeConversationId === conv._id}
                        isEditing={editingConvId === conv._id}
                        editTitleText={editTitleText}
                        setEditTitleText={setEditTitleText}
                        onSelect={() => handleSelectConversation(conv._id)}
                        onStartRename={(e) => handleStartRename(conv, e)}
                        onSaveRename={(e) => handleSaveRename(conv._id, e)}
                        onCancelRename={handleCancelRename}
                        onDelete={(e) => handleDeleteConversation(conv._id, e)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* =========================================================================
            2. MAIN CHAT AREA (Expansive ChatGPT / Gemini Canvas)
           ========================================================================= */}
        <main className="assistant-main-canvas">
          
          {/* Top Chat Bar Header */}
          <header className="chat-top-header">
            <div className="chat-top-header-left">
              {!showHistory && (
                <button
                  className="chat-header-icon-btn sidebar-opener"
                  onClick={() => setShowHistory(true)}
                  title="Show chat history"
                >
                  <PanelLeft size={18} />
                </button>
              )}

              <div className="chat-title-group">
                <span className="chat-current-title" title={activeTitle}>
                  {activeTitle}
                </span>
                {activeConversationId && (
                  <button
                    className="chat-title-rename-btn"
                    onClick={() => {
                      if (activeConv) {
                        setEditingConvId(activeConv._id);
                        setEditTitleText(activeConv.title || '');
                      }
                    }}
                    title="Rename this conversation"
                  >
                    <Edit3 size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="chat-top-header-right">
              {/* "+ New Chat" Button in Header */}
              <button
                className="chat-header-action-btn primary"
                onClick={handleNewChat}
                title="Start a new chat thread"
              >
                <Plus size={15} />
                <span>New Chat</span>
              </button>

              {/* Multi-Agent Routing Inspector Toggle */}
              <button
                className={`chat-header-action-btn ${showAgentDrawer ? 'active' : ''}`}
                onClick={() => setShowAgentDrawer(!showAgentDrawer)}
                title="View Multi-Agent Engine and Grounding routing"
              >
                <ShieldCheck size={15} />
                <span>Agent Router</span>
              </button>

              {/* Clear Current Chat */}
              <button
                className="chat-header-icon-btn"
                onClick={() => setShowClearConfirm(true)}
                title="Clear current chat"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </header>

          {/* Messages Scroll Area */}
          <div className="chat-scroll-container custom-scrollbar">
            <div className="chat-content-constrained">
              
              {loadingChat ? (
                <div className="chat-loading-screen">
                  <div className="chat-loading-spinner" />
                  <span>Loading conversation history...</span>
                </div>
              ) : isFreshChat ? (
                /* Fresh / Empty Chat Welcome Hero (Gemini / ChatGPT style) */
                <div className="gemini-hero-welcome">
                  <div className="gemini-hero-logo">
                    <Sparkles size={36} color="#00A884" />
                  </div>
                  <h1 className="gemini-hero-title">
                    Hello, <span className="gemini-gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
                  </h1>
                  <p className="gemini-hero-subtitle">
                    How can I assist your onboarding and roadmap today?
                  </p>

                  <div className="gemini-prompt-grid">
                    {SUGGESTED_PROMPTS.map((item, pIdx) => (
                      <button
                        key={pIdx}
                        className="gemini-prompt-card"
                        onClick={() => handleSendMessage(item.title)}
                      >
                        <div className="prompt-card-top">
                          <span className="prompt-card-icon">{item.icon}</span>
                          <span className="prompt-card-category">{item.category}</span>
                        </div>
                        <div className="prompt-card-title">{item.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Active Message Stream */
                <div className="chat-stream-list">
                  {messages.map((msg, idx) => {
                    const isAi = msg.sender === 'assistant';
                    return (
                      <div
                        key={idx}
                        className={`chat-message-row ${isAi ? 'ai-turn' : 'user-turn'} animate-fade-in`}
                      >
                        <div className={`chat-message-avatar ${isAi ? 'ai-avatar' : 'user-avatar'}`}>
                          {isAi ? <Sparkles size={16} /> : <User size={16} />}
                        </div>

                        <div className="chat-message-body">
                          {isAi && (
                            <div className="chat-ai-header-meta">
                              <span className="agent-tag-pill">
                                <Sparkles size={11} />
                                <span>{msg.agent || 'OnboardIQ AI'}</span>
                              </span>

                              {msg.confidence && (
                                <span className="confidence-tag-pill">
                                  Confidence: {msg.confidence}
                                </span>
                              )}
                            </div>
                          )}

                          <div className={`chat-bubble-content ${isAi ? 'ai-bubble' : 'user-bubble'}`}>
                            <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>

                            {/* Source Citations Card */}
                            {isAi && msg.sources && msg.sources.length > 0 && (
                              <div className="sources-wrapper-box">
                                <div className="sources-header-label">
                                  <CheckCheck size={13} color="#00A884" />
                                  <span>Verified Source Citations ({msg.sources.length})</span>
                                </div>
                                <div className="sources-grid-stack">
                                  {msg.sources.map((src, sIdx) => (
                                    <SourceCard key={sIdx} source={src} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Message Actions */}
                          {isAi && (
                            <div className="chat-turn-actions">
                              <button
                                className="chat-action-btn"
                                onClick={() => handleCopy(msg.text, idx)}
                                title="Copy response to clipboard"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check size={13} color="#00A884" />
                                    <span style={{ color: '#00A884' }}>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={13} />
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

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="chat-message-row ai-turn animate-fade-in">
                      <div className="chat-message-avatar ai-avatar">
                        <Sparkles size={16} />
                      </div>
                      <div className="chat-message-body">
                        <div className="chat-ai-header-meta">
                          <span className="agent-tag-pill">
                            <Sparkles size={11} />
                            <span>Routing query...</span>
                          </span>
                        </div>
                        <div className="chat-bubble-content ai-bubble">
                          <div className="gemini-typing-pulse">
                            <span className="pulse-dot" />
                            <span className="pulse-dot" />
                            <span className="pulse-dot" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Floating ChatGPT / Gemini Input Bar */}
          <footer className="chat-floating-input-zone">
            <div className="chat-input-wrapper">
              {/* Active Thread Banner Indicator */}
              {activeConversationId && (
                <div className="active-thread-banner animate-fade-in">
                  <div className="active-thread-banner-text">
                    <span className="thread-dot" />
                    <span>In thread: <strong>{activeTitle}</strong></span>
                  </div>
                  <button
                    type="button"
                    className="btn-start-fresh-thread"
                    onClick={handleNewChat}
                    title="Start a separate new conversation"
                  >
                    <Plus size={13} />
                    <span>Start New Chat</span>
                  </button>
                </div>
              )}

              <form
                className="chat-input-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <button
                  type="button"
                  className="chat-input-new-chat-btn"
                  onClick={handleNewChat}
                  title="New chat - start a fresh conversation (Ctrl+Shift+O)"
                >
                  <Plus size={16} />
                </button>

                <textarea
                  ref={chatInputRef}
                  className="chat-multiline-input custom-scrollbar"
                  placeholder={
                    activeConversationId
                      ? `Ask follow-up, or click + for New Chat...`
                      : "Ask OnboardIQ anything about policies, tasks, tooling..."
                  }
                  value={inputQuery}
                  rows={1}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <button
                  type="submit"
                  className="chat-send-submit-btn"
                  disabled={!inputQuery.trim() || isTyping}
                  title="Send prompt (Enter)"
                >
                  <Send size={16} />
                </button>
              </form>

              <div className="chat-input-disclaimer">
                OnboardIQ AI is grounded with ChromaDB vector store and company policies. Verify critical HR information.
              </div>
            </div>
          </footer>
        </main>

        {/* =========================================================================
            3. MULTI-AGENT ROUTING INSPECTOR DRAWER
           ========================================================================= */}
        {showAgentDrawer && (
          <aside className="assistant-inspector-drawer animate-slide-left">
            <div className="inspector-drawer-header">
              <div className="inspector-drawer-title">
                <ShieldCheck size={17} color="#00A884" />
                <span>Multi-Agent Engine</span>
              </div>
              <button
                className="inspector-close-btn"
                onClick={() => setShowAgentDrawer(false)}
                title="Close Agent Routing Inspector"
              >
                <X size={16} />
              </button>
            </div>

            <div className="inspector-drawer-content custom-scrollbar">
              <p className="inspector-summary-text">
                Every prompt is routed via LangGraph to specialized agent nodes grounded in your corporate handbook:
              </p>

              <div className="agent-spec-card">
                <div className="agent-spec-title">🛡️ HR Agent</div>
                <div className="agent-spec-desc">
                  Annual leave, sick leave, compensation, office hours, benefits, and conduct codes.
                </div>
              </div>

              <div className="agent-spec-card">
                <div className="agent-spec-title">⚡ IT & Security Agent</div>
                <div className="agent-spec-desc">
                  Software installations, SSH keys, VPN access, MFA configuration, and laptop security.
                </div>
              </div>

              <div className="agent-spec-card">
                <div className="agent-spec-title">🎓 Learning Agent</div>
                <div className="agent-spec-desc">
                  Role-specific skill curriculums, architecture deep dives, and onboarding courses.
                </div>
              </div>

              <div className="agent-spec-card">
                <div className="agent-spec-title">🚀 Onboarding Agent</div>
                <div className="agent-spec-desc">
                  Milestone roadmaps, Next Best Action prioritization, and pending milestone trackers.
                </div>
              </div>

              <div className="anti-hallucination-card">
                <div className="anti-hallucination-title">
                  <Info size={14} />
                  <span>Anti-Hallucination Guard</span>
                </div>
                <div className="anti-hallucination-desc">
                  If a query lacks matching company documentation, the system responds factually without fabricating policies.
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="chat-modal-overlay">
          <div className="chat-confirm-modal animate-scale-in">
            <div className="confirm-modal-header">
              <AlertCircle size={22} color="#EF4444" />
              <h3>Clear this conversation?</h3>
            </div>
            <p className="confirm-modal-body">
              This will remove all messages from the current conversation. Past sessions in your history sidebar will not be affected.
            </p>
            <div className="confirm-modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleClearCurrentChat}
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for each conversation item in history sidebar
const HistoryItem = ({
  conv,
  isActive,
  isEditing,
  editTitleText,
  setEditTitleText,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete
}) => {
  return (
    <div
      className={`history-thread-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      title={conv.title}
    >
      <div className="history-thread-inner">
        <MessageSquare size={14} className="history-thread-icon" />

        {isEditing ? (
          <form
            className="history-rename-form"
            onSubmit={(e) => {
              e.preventDefault();
              onSaveRename(e);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              className="history-rename-input"
              value={editTitleText}
              autoFocus
              onChange={(e) => setEditTitleText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onCancelRename(e);
              }}
            />
            <button
              type="submit"
              className="history-rename-action-btn check"
              title="Save title"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              className="history-rename-action-btn cancel"
              onClick={onCancelRename}
              title="Cancel"
            >
              <X size={12} />
            </button>
          </form>
        ) : (
          <>
            <span className="history-thread-title">
              {conv.title || 'New Conversation'}
            </span>

            <div className="history-item-hover-actions">
              <button
                className="history-hover-btn"
                onClick={onStartRename}
                title="Rename chat"
              >
                <Edit3 size={12} />
              </button>
              <button
                className="history-hover-btn delete"
                onClick={onDelete}
                title="Delete chat"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </>
        )}
      </div>

      {!isEditing && (
        <div className="history-thread-meta">
          <span className="history-thread-time">
            {formatRelativeTime(conv.updatedAt || conv.createdAt)}
          </span>
          {conv.messageCount !== undefined && conv.messageCount > 0 && (
            <span className="history-thread-msg-count">
              {conv.messageCount} {conv.messageCount === 1 ? 'msg' : 'msgs'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Assistant;
