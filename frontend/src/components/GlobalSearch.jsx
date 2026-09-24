import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  CheckSquare,
  Compass,
  FileText,
  Bot,
  Calendar,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { taskAPI, aiAPI, documentAPI } from '../services/api';
import '../styles/navbar.css';
import '../styles/search.css';

// Standard corporate day themes
const DAY_THEMES = {
  1: 'Orientation & Workspace Credentials',
  2: 'Tools, Hardware & Environment Setup',
  3: 'Security Compliance & Team Introductions',
  4: 'Architecture, Repos & Core Workflows',
  5: 'First Milestone Review & Contribution'
};

// Highlight helper
const highlightMatch = (text, query) => {
  if (!text || !query || !query.trim()) return text;
  const terms = query
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (terms.length === 0) return text;
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="search-highlight-hit">{part}</mark>
    ) : (
      part
    )
  );
};

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  // Cached datasets for fast, instantaneous search
  const [tasks, setTasks] = useState([]);
  const [learningStages, setLearningStages] = useState([]);
  const [documents, setDocuments] = useState([]);

  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Load datasets when component mounts or on first focus
  const loadSearchData = async () => {
    if (tasks.length > 0 && learningStages.length > 0) return;
    try {
      setLoading(true);
      const [tasksRes, lpRes, docRes] = await Promise.allSettled([
        taskAPI.getTasks({}),
        aiAPI.getLearningPath(),
        documentAPI.getDocuments({})
      ]);

      if (tasksRes.status === 'fulfilled' && tasksRes.value.data) {
        setTasks(tasksRes.value.data);
      }
      if (lpRes.status === 'fulfilled' && lpRes.value.data?.stages) {
        setLearningStages(lpRes.value.data.stages);
      }
      if (docRes.status === 'fulfilled' && docRes.value.data) {
        setDocuments(docRes.value.data);
      }
    } catch (err) {
      console.error('Error prefetching global search data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter items across all 4+ categories
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return {
        tasks: [],
        onboarding: [],
        learning: [],
        assistant: [],
        documents: [],
        totalCount: 0
      };
    }

    const tokens = trimmed.split(/[\s,]+/).filter(Boolean);

    const matchesTokens = (corpus) => {
      const lower = corpus.toLowerCase();
      return tokens.every((token) => lower.includes(token));
    };

    // 1. Tasks Match
    const matchedTasks = tasks.filter((t) => {
      const corpus = `${t.title || ''} ${t.description || ''} ${t.category || ''} ${t.priority || ''} ${t.status || ''} day ${t.dayNumber || ''}`;
      return matchesTokens(corpus);
    });

    // 2. Onboarding Match (Milestone context: dayNumber, theme, title, description)
    const matchedOnboarding = tasks.filter((t) => {
      const dayTheme = DAY_THEMES[t.dayNumber] || `Day ${t.dayNumber}`;
      const corpus = `${t.title || ''} ${t.description || ''} ${dayTheme} day ${t.dayNumber || ''} milestone ${t.category || ''}`;
      return matchesTokens(corpus);
    });

    // 3. Learning Path Match (Stages, modules, skills, descriptions)
    const matchedLearning = [];
    learningStages.forEach((stage, stageIdx) => {
      // Stage title match
      if (matchesTokens(`${stage.title || ''} ${stage.description || ''}`)) {
        matchedLearning.push({
          id: `stage-${stageIdx}`,
          type: 'stage',
          stageIndex: stageIdx,
          stageTitle: stage.title,
          title: `Stage ${stage.order || stageIdx + 1}: ${stage.title}`,
          description: stage.description,
          detail: `${stage.modules?.length || 0} modules • Level ${stage.order || stageIdx + 1}`
        });
      }
      // Modules match
      if (Array.isArray(stage.modules)) {
        stage.modules.forEach((mod, modIdx) => {
          const modCorpus = `${mod.title || ''} ${mod.description || ''} ${mod.skills?.join(' ') || ''} ${stage.title || ''}`;
          if (matchesTokens(modCorpus)) {
            matchedLearning.push({
              id: `mod-${stageIdx}-${modIdx}`,
              type: 'module',
              stageIndex: stageIdx,
              moduleIndex: modIdx,
              stageTitle: stage.title,
              title: mod.title,
              description: mod.description,
              skills: mod.skills,
              completed: mod.completed,
              detail: `${stage.title} • ${mod.estimatedDuration || '2-3 hrs'} • ${mod.difficulty || 'Intermediate'}`
            });
          }
        });
      }
    });

    // 4. AI Assistant matching suggestions & queries
    const assistantPrompts = [
      {
        id: 'ai-custom',
        title: `Ask AI Tutor: "${query.trim()}"`,
        description: `Get autonomous AI answer with citations and company policy references for "${query.trim()}"`,
        query: query.trim()
      },
      {
        id: 'ai-tasks',
        title: `Ask AI: "What tasks should I prioritize for ${query.trim()}?"`,
        description: 'Generate step-by-step guidance and best practices for completing your assigned tasks.',
        query: `What tasks should I prioritize for ${query.trim()} and how should I approach them?`
      },
      {
        id: 'ai-policy',
        title: `Ask AI: "What does company policy say about ${query.trim()}?"`,
        description: 'Check official handbook rules, security compliance, and departmental SOPs.',
        query: `What does company policy say about ${query.trim()}?`
      }
    ];

    // 5. Documents & Policies
    const matchedDocs = documents.filter((doc) => {
      const docCorpus = `${doc.title || doc.filename || ''} ${doc.department || ''} ${doc.summary || ''} ${doc.fileType || ''}`;
      return matchesTokens(docCorpus);
    });

    const totalCount =
      matchedTasks.length +
      matchedOnboarding.length +
      matchedLearning.length +
      assistantPrompts.length +
      matchedDocs.length;

    return {
      tasks: matchedTasks,
      onboarding: matchedOnboarding,
      learning: matchedLearning,
      assistant: assistantPrompts,
      documents: matchedDocs,
      totalCount
    };
  }, [query, tasks, learningStages, documents]);

  const handleFocus = () => {
    setIsOpen(true);
    loadSearchData();
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // Navigations with search query preserved
  const handleSelectOnboarding = (item) => {
    setIsOpen(false);
    navigate(`/onboarding?day=${item.dayNumber || 1}&q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectTask = (task) => {
    setIsOpen(false);
    navigate(`/tasks?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectLearning = (item) => {
    setIsOpen(false);
    navigate(`/learning?stage=${item.stageIndex}&q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectAI = (prompt) => {
    setIsOpen(false);
    navigate(`/assistant?q=${encodeURIComponent(prompt.query)}`, {
      state: { initialQuery: prompt.query }
    });
  };

  const handleSelectDoc = (doc) => {
    setIsOpen(false);
    navigate(`/documents?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      // Auto-navigate to first match or onboarding with query
      if (searchResults.onboarding.length > 0) {
        handleSelectOnboarding(searchResults.onboarding[0]);
      } else if (searchResults.tasks.length > 0) {
        handleSelectTask(searchResults.tasks[0]);
      } else if (searchResults.learning.length > 0) {
        handleSelectLearning(searchResults.learning[0]);
      } else {
        handleSelectAI({ query: query.trim() });
      }
    }
  };

  // Active filtered items
  const activeItemsCount = {
    all: searchResults.totalCount,
    onboarding: searchResults.onboarding.length,
    tasks: searchResults.tasks.length,
    learning: searchResults.learning.length,
    assistant: searchResults.assistant.length,
    documents: searchResults.documents.length
  };

  return (
    <div className="navbar-search-container" ref={searchContainerRef}>
      <div className={`navbar-search ${isOpen && query.trim() ? 'search-active' : ''}`}>
        <Search size={15} color={isOpen ? '#00A884' : '#94A3B8'} />
        <input
          ref={inputRef}
          type="text"
          className="navbar-search-input"
          placeholder="Search tasks, onboarding, learning, policies, AI..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button className="search-clear-btn" onClick={handleClear} title="Clear search">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Floating Results Popover */}
      {isOpen && query.trim().length > 0 && (
        <div className="search-dropdown-menu">
          {/* Category Filter Tabs */}
          <div className="search-category-tabs">
            <button
              className={`search-cat-tab ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All <span className="cat-count">{activeItemsCount.all}</span>
            </button>
            <button
              className={`search-cat-tab ${activeCategory === 'onboarding' ? 'active' : ''}`}
              onClick={() => setActiveCategory('onboarding')}
            >
              Onboarding <span className="cat-count">{activeItemsCount.onboarding}</span>
            </button>
            <button
              className={`search-cat-tab ${activeCategory === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveCategory('tasks')}
            >
              Tasks <span className="cat-count">{activeItemsCount.tasks}</span>
            </button>
            <button
              className={`search-cat-tab ${activeCategory === 'learning' ? 'active' : ''}`}
              onClick={() => setActiveCategory('learning')}
            >
              Learning Path <span className="cat-count">{activeItemsCount.learning}</span>
            </button>
            <button
              className={`search-cat-tab ${activeCategory === 'assistant' ? 'active' : ''}`}
              onClick={() => setActiveCategory('assistant')}
            >
              AI Assistant <span className="cat-count">{activeItemsCount.assistant}</span>
            </button>
            {activeItemsCount.documents > 0 && (
              <button
                className={`search-cat-tab ${activeCategory === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveCategory('documents')}
              >
                Docs <span className="cat-count">{activeItemsCount.documents}</span>
              </button>
            )}
          </div>

          <div className="search-results-scrollable">
            {/* 1. Onboarding Section */}
            {(activeCategory === 'all' || activeCategory === 'onboarding') &&
              searchResults.onboarding.length > 0 && (
                <div className="search-group">
                  <div className="search-group-header">
                    <Calendar size={13} color="#00A884" />
                    <span>My Onboarding Milestones ({searchResults.onboarding.length})</span>
                    <button
                      className="search-group-view-all"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/onboarding?q=${encodeURIComponent(query.trim())}`);
                      }}
                    >
                      View in Onboarding <ChevronRight size={12} />
                    </button>
                  </div>
                  {searchResults.onboarding.slice(0, activeCategory === 'all' ? 3 : 8).map((item) => (
                    <div
                      key={`onb-${item._id}`}
                      className="search-result-item"
                      onClick={() => handleSelectOnboarding(item)}
                    >
                      <div className="result-badge onboarding">Day {item.dayNumber}</div>
                      <div className="result-text-body">
                        <div className="result-title">
                          {highlightMatch(item.title, query)}
                        </div>
                        <div className="result-subtitle">
                          {DAY_THEMES[item.dayNumber] || `Day ${item.dayNumber}`} • {item.category} •{' '}
                          <span className={`status-pill ${item.status}`}>
                            {item.status === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="result-arrow" />
                    </div>
                  ))}
                </div>
              )}

            {/* 2. Tasks Section */}
            {(activeCategory === 'all' || activeCategory === 'tasks') &&
              searchResults.tasks.length > 0 && (
                <div className="search-group">
                  <div className="search-group-header">
                    <CheckSquare size={13} color="#0284C7" />
                    <span>Tasks ({searchResults.tasks.length})</span>
                    <button
                      className="search-group-view-all"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/tasks?q=${encodeURIComponent(query.trim())}`);
                      }}
                    >
                      View in Tasks <ChevronRight size={12} />
                    </button>
                  </div>
                  {searchResults.tasks.slice(0, activeCategory === 'all' ? 3 : 8).map((task) => (
                    <div
                      key={`task-${task._id}`}
                      className="search-result-item"
                      onClick={() => handleSelectTask(task)}
                    >
                      <div className="result-badge task">{task.category || 'Task'}</div>
                      <div className="result-text-body">
                        <div className="result-title">
                          {highlightMatch(task.title, query)}
                        </div>
                        <div className="result-subtitle">
                          Priority: {task.priority?.toUpperCase()} • Day {task.dayNumber} •{' '}
                          <span className={`status-pill ${task.status}`}>
                            {task.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={14} className="result-arrow" />
                    </div>
                  ))}
                </div>
              )}

            {/* 3. Learning Path Section */}
            {(activeCategory === 'all' || activeCategory === 'learning') &&
              searchResults.learning.length > 0 && (
                <div className="search-group">
                  <div className="search-group-header">
                    <Compass size={13} color="#8B5CF6" />
                    <span>Learning Path ({searchResults.learning.length})</span>
                    <button
                      className="search-group-view-all"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(`/learning?q=${encodeURIComponent(query.trim())}`);
                      }}
                    >
                      View in Learning <ChevronRight size={12} />
                    </button>
                  </div>
                  {searchResults.learning.slice(0, activeCategory === 'all' ? 3 : 8).map((item) => (
                    <div
                      key={`lp-${item.id}`}
                      className="search-result-item"
                      onClick={() => handleSelectLearning(item)}
                    >
                      <div className="result-badge learning">
                        {item.type === 'stage' ? 'Stage' : 'Module'}
                      </div>
                      <div className="result-text-body">
                        <div className="result-title">
                          {highlightMatch(item.title, query)}
                        </div>
                        <div className="result-subtitle">{item.detail}</div>
                      </div>
                      <ArrowRight size={14} className="result-arrow" />
                    </div>
                  ))}
                </div>
              )}

            {/* 4. AI Assistant Section */}
            {(activeCategory === 'all' || activeCategory === 'assistant') && (
              <div className="search-group">
                <div className="search-group-header">
                  <Bot size={13} color="#008769" />
                  <span>AI Assistant Actions & Inquiries</span>
                </div>
                {searchResults.assistant.map((prompt) => (
                  <div
                    key={`ai-${prompt.id}`}
                    className="search-result-item ai-result"
                    onClick={() => handleSelectAI(prompt)}
                  >
                    <div className="result-badge ai">
                      <Sparkles size={11} style={{ marginRight: 3 }} /> AI
                    </div>
                    <div className="result-text-body">
                      <div className="result-title">{prompt.title}</div>
                      <div className="result-subtitle">{prompt.description}</div>
                    </div>
                    <ArrowRight size={14} className="result-arrow" />
                  </div>
                ))}
              </div>
            )}

            {/* 5. Documents Section */}
            {(activeCategory === 'all' || activeCategory === 'documents') &&
              searchResults.documents.length > 0 && (
                <div className="search-group">
                  <div className="search-group-header">
                    <FileText size={13} color="#F59E0B" />
                    <span>Knowledge Documents ({searchResults.documents.length})</span>
                  </div>
                  {searchResults.documents.slice(0, 3).map((doc) => (
                    <div
                      key={`doc-${doc._id}`}
                      className="search-result-item"
                      onClick={() => handleSelectDoc(doc)}
                    >
                      <div className="result-badge document">{doc.department}</div>
                      <div className="result-text-body">
                        <div className="result-title">
                          {highlightMatch(doc.title || doc.filename, query)}
                        </div>
                        <div className="result-subtitle">
                          {doc.department} Policy • {doc.fileType?.toUpperCase()}
                        </div>
                      </div>
                      <ArrowRight size={14} className="result-arrow" />
                    </div>
                  ))}
                </div>
              )}

            {/* Empty state if nothing matches */}
            {searchResults.totalCount === 0 && !loading && (
              <div className="search-empty-state">
                <Search size={28} color="#94A3B8" />
                <p className="empty-title">No direct matches for "{query}"</p>
                <p className="empty-sub">
                  Ask AI Assistant to explain or locate policies and tasks related to this query.
                </p>
                <button
                  className="search-ai-fallback-btn"
                  onClick={() =>
                    handleSelectAI({
                      id: 'ai-fallback',
                      query: `What information, policies, or tasks exist for: "${query}"?`
                    })
                  }
                >
                  <Sparkles size={14} />
                  <span>Ask AI Assistant about "{query}"</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="search-dropdown-footer">
            <span>Press <kbd>Enter</kbd> to jump to top match</span>
            <span>Press <kbd>Esc</kbd> to dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
