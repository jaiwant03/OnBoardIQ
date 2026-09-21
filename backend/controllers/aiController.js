const Conversation = require('../models/Conversation');
const OnboardingTask = require('../models/OnboardingTask');
const LearningPath = require('../models/LearningPath');
const OnboardingProgress = require('../models/OnboardingProgress');
const aiServiceClient = require('../services/aiServiceClient');

// @desc    Chat with AI Assistant (LangGraph + RAG + Source Verification)
// @route   POST /api/ai/chat
const chat = async (req, res) => {
  try {
    const { query, conversationId } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Query string is required' });
    }

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, user: req.user._id });
    }

    const cleanTitle = query.length > 42 ? query.slice(0, 40).trim() + '...' : query.trim();

    if (!conversation) {
      conversation = await Conversation.create({
        user: req.user._id,
        title: cleanTitle || 'New Chat',
        messages: []
      });
    } else if (!conversation.title || conversation.title === 'New Conversation' || conversation.title === 'New Chat' || conversation.messages.length === 0) {
      conversation.title = cleanTitle || conversation.title;
    }

    // Build recent history for context
    const history = conversation.messages.slice(-6).map(m => ({
      sender: m.sender,
      text: m.text
    }));

    // Record user message
    conversation.messages.push({
      sender: 'user',
      text: query,
      timestamp: new Date()
    });

    // Fetch employee onboarding state from MongoDB
    const tasks = await OnboardingTask.find({ user: req.user._id }).sort({ dayNumber: 1 });
    const completedTasks = tasks.filter(t => t.status === 'completed').map(t => t.title);
    const pendingTasks = tasks.filter(t => t.status !== 'completed').map(t => ({
      _id: t._id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      dayNumber: t.dayNumber,
      status: t.status
    }));
    const progress = await OnboardingProgress.findOne({ user: req.user._id });

    // Call Python AI Service with complete employee context
    const aiResult = await aiServiceClient.sendChatMessage({
      query,
      user_name: req.user.name,
      user_role: req.user.role,
      user_department: req.user.department,
      user_experience: req.user.experience,
      conversation_history: history,
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      progress_percentage: progress ? progress.overallPercentage : 0,
      skills: req.user.skills || []
    });

    // Record assistant response
    const assistantMessage = {
      sender: 'assistant',
      text: aiResult.response,
      agent: aiResult.agent || 'OnboardIQ AI',
      sources: aiResult.sources || [],
      confidence: aiResult.confidence || 'High',
      reasoning: aiResult.reasoning || '',
      timestamp: new Date()
    };
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      conversationId: conversation._id,
      conversationTitle: conversation.title,
      response: aiResult.response,
      agent: aiResult.agent,
      agent_id: aiResult.agent_id,
      sources: aiResult.sources || [],
      confidence: aiResult.confidence || 'High',
      reasoning: aiResult.reasoning,
      is_verified: aiResult.is_verified,
      updatedAt: conversation.updatedAt
    });
  } catch (error) {
    console.error('[AI Controller Error]:', error);
    res.status(500).json({ message: error.message || 'Error processing AI chat' });
  }
};

// @desc    Get Next Best Action recommendation
// @route   POST /api/ai/next-action
const getNextAction = async (req, res) => {
  try {
    const tasks = await OnboardingTask.find({ user: req.user._id }).sort({ dayNumber: 1 });
    const completedTasks = tasks.filter(t => t.status === 'completed').map(t => t.title);
    const pendingTasks = tasks.filter(t => t.status !== 'completed');
    const progress = await OnboardingProgress.findOne({ user: req.user._id });

    const recommendation = await aiServiceClient.getNextBestAction({
      completed_tasks: completedTasks,
      pending_tasks: pendingTasks,
      role: req.user.role,
      department: req.user.department,
      progress_percentage: progress ? progress.overallPercentage : 0
    });

    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get or generate Learning Path
// @route   GET /api/ai/learning-path
const getLearningPath = async (req, res) => {
  try {
    const lp = await LearningPath.findOne({ user: req.user._id });
    res.json(lp || { stages: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle module completed in learning path
// @route   PUT /api/ai/learning-path/module
const toggleLearningModule = async (req, res) => {
  try {
    const { stageIndex, moduleIndex } = req.body;
    const lp = await LearningPath.findOne({ user: req.user._id });
    if (!lp) return res.status(404).json({ message: 'Learning path not found' });

    if (lp.stages[stageIndex] && lp.stages[stageIndex].modules[moduleIndex]) {
      const current = lp.stages[stageIndex].modules[moduleIndex].completed;
      lp.stages[stageIndex].modules[moduleIndex].completed = !current;
      lp.updatedAt = new Date();
      await lp.save();
    }

    res.json(lp);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI service health status
// @route   GET /api/ai/health
const getHealth = async (req, res) => {
  try {
    const health = await aiServiceClient.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ status: 'offline', error: error.message });
  }
};

// @desc    Get user conversations
// @route   GET /api/ai/conversations
const getConversations = async (req, res) => {
  try {
    const convos = await Conversation.find({ user: req.user._id })
      .select('title updatedAt messages createdAt')
      .sort({ updatedAt: -1 });

    const formatted = convos.map(c => ({
      _id: c._id,
      title: c.title,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
      messageCount: c.messages ? c.messages.length : 0,
      preview: c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1].text.slice(0, 60) : ''
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single conversation with all messages
// @route   GET /api/ai/conversations/:id
const getConversationById = async (req, res) => {
  try {
    const convo = await Conversation.findOne({ _id: req.params.id, user: req.user._id });
    if (!convo) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.json(convo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new empty conversation
// @route   POST /api/ai/conversations
const createConversation = async (req, res) => {
  try {
    const title = req.body?.title || 'New Chat';
    const convo = await Conversation.create({
      user: req.user._id,
      title,
      messages: []
    });
    res.status(201).json(convo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear conversation
// @route   DELETE /api/ai/conversations/:id
const clearConversation = async (req, res) => {
  try {
    await Conversation.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Conversation cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  chat,
  getNextAction,
  getLearningPath,
  toggleLearningModule,
  getHealth,
  getConversations,
  getConversationById,
  createConversation,
  clearConversation
};
