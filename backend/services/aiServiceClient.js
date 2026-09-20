const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 120000, // 120s default for local LLM inference
  headers: {
    'Content-Type': 'application/json'
  }
});

const checkHealth = async () => {
  try {
    const res = await aiClient.get('/health', { timeout: 4000 });
    return res.data;
  } catch (error) {
    return {
      status: 'offline',
      service: 'OnboardIQ AI Intelligence Service',
      ollama: { online: false, status_text: 'AI Service Unreachable' },
      chromadb: { total_chunks: 0 },
      error: error.message
    };
  }
};

const sendChatMessage = async (chatData) => {
  try {
    const res = await aiClient.post('/api/ai/chat', chatData);
    return res.data;
  } catch (error) {
    console.error('[AI Client] Chat error:', error.message);
    // Return graceful structured fallback
    return {
      response: "AI Agent is currently warming up or unavailable. Please ensure the Python AI Service and Ollama are running.",
      agent: "OnboardIQ Agent",
      sources: [],
      confidence: "Low",
      reasoning: "Failed to connect to Python AI Service: " + error.message,
      is_verified: false
    };
  }
};

const generateOnboardingPlan = async (profileData) => {
  try {
    const res = await aiClient.post('/api/ai/onboarding-plan', profileData);
    return res.data;
  } catch (error) {
    console.error('[AI Client] Plan error:', error.message);
    throw error;
  }
};

const getNextBestAction = async (taskData) => {
  try {
    const res = await aiClient.post('/api/ai/next-action', taskData);
    return res.data;
  } catch (error) {
    console.error('[AI Client] Next action error:', error.message);
    return {
      task_title: taskData.pending_tasks?.[0]?.title || "Complete Security Training",
      reason: "Prioritized as an essential onboarding milestone.",
      priority: "high",
      category: "Security"
    };
  }
};

const generateLearningPath = async (profileData) => {
  try {
    const res = await aiClient.post('/api/ai/learning-path', profileData);
    return res.data;
  } catch (error) {
    console.error('[AI Client] Learning path error:', error.message);
    throw error;
  }
};

const indexDocument = async (docData) => {
  try {
    const res = await aiClient.post('/api/ai/index-document', docData, {
      timeout: 300000 // 5 minutes for document extraction and batch vectorization
    });
    return res.data;
  } catch (error) {
    console.error('[AI Client] Index doc error:', error.message);
    throw error;
  }
};

const clearVectorStore = async () => {
  try {
    const res = await aiClient.post('/api/ai/clear-vector-store', {}, { timeout: 10000 });
    return res.data;
  } catch (error) {
    console.error('[AI Client] Clear vector store error:', error.message);
    return { status: 'failed', error: error.message };
  }
};

module.exports = {
  checkHealth,
  sendChatMessage,
  generateOnboardingPlan,
  getNextBestAction,
  generateLearningPath,
  indexDocument,
  clearVectorStore
};

