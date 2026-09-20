require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const OnboardingTask = require('../models/OnboardingTask');
const LearningPath = require('../models/LearningPath');
const OnboardingProgress = require('../models/OnboardingProgress');
const Document = require('../models/Document');
const Conversation = require('../models/Conversation');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onboardiq';

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected to MongoDB');

    // Clear existing data for clean demo
    await User.deleteMany({});
    await OnboardingTask.deleteMany({});
    await LearningPath.deleteMany({});
    await OnboardingProgress.deleteMany({});
    await Document.deleteMany({});
    await Conversation.deleteMany({});

    console.log('[Seed] Cleared existing records.');

    // 1. Create Demo Employee: Rahul Kumar
    const rahul = await User.create({
      name: 'Rahul Kumar',
      email: 'rahul@company.com',
      password: 'password123',
      role: 'Software Developer',
      department: 'Engineering',
      experience: 'Fresher',
      joiningDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Git', 'Docker'],
      preferredLearningStyle: 'Hands-on Projects & Pair Programming',
      userType: 'employee'
    });

    // 2. Create Admin / HR User
    const admin = await User.create({
      name: 'Sarah Jenkins',
      email: 'admin@company.com',
      password: 'admin123',
      role: 'Head of People & Culture',
      department: 'HR',
      experience: 'Senior (5+ yrs)',
      skills: ['Talent Development', 'HR Analytics', 'People Operations'],
      userType: 'admin'
    });

    // 3. Create Additional Employees for realistic Admin KPI views
    const otherEmployeesData = [
      {
        name: 'Elena Rostova',
        email: 'elena@company.com',
        password: 'password123',
        role: 'Frontend Engineer',
        department: 'Engineering',
        experience: 'Junior (1-2 yrs)',
        skills: ['React', 'CSS', 'Figma'],
        userType: 'employee'
      },
      {
        name: 'Marcus Chen',
        email: 'marcus@company.com',
        password: 'password123',
        role: 'DevOps Specialist',
        department: 'IT',
        experience: 'Mid-Level (3-5 yrs)',
        skills: ['Kubernetes', 'Docker', 'AWS'],
        userType: 'employee'
      },
      {
        name: 'Priya Sharma',
        email: 'priya@company.com',
        password: 'password123',
        role: 'Product Designer',
        department: 'Product',
        experience: 'Mid-Level (3-5 yrs)',
        skills: ['Figma', 'UI/UX', 'Design Systems'],
        userType: 'employee'
      }
    ];
    const otherEmployees = await Promise.all(otherEmployeesData.map((emp) => User.create(emp)));

    // 4. Create Onboarding Tasks for Rahul Kumar matching 65% progress (13 completed, 7 remaining, 3 in progress, 1 overdue)
    const rahulTasks = [
      // Day 1 (Completed)
      { user: rahul._id, dayNumber: 1, title: 'Complete HR Registration & ID Verification', category: 'HR', priority: 'high', status: 'completed', estimatedMinutes: 30 },
      { user: rahul._id, dayNumber: 1, title: 'Read Company Employee Handbook', category: 'HR', priority: 'medium', status: 'completed', estimatedMinutes: 45 },
      { user: rahul._id, dayNumber: 1, title: 'Configure Corporate Google Workspace & Email', category: 'IT', priority: 'high', status: 'completed', estimatedMinutes: 25 },
      { user: rahul._id, dayNumber: 1, title: 'Join Core Slack Channels (#general, #engineering)', category: 'IT', priority: 'medium', status: 'completed', estimatedMinutes: 15 },
      { user: rahul._id, dayNumber: 1, title: 'Set up 1Password Vault for Team Credentials', category: 'Security', priority: 'high', status: 'completed', estimatedMinutes: 20 },
      
      // Day 2 (Completed & In Progress)
      { user: rahul._id, dayNumber: 2, title: 'Install Node.js v22 & Python 3.13 Runtimes', category: 'IT', priority: 'high', status: 'completed', estimatedMinutes: 40 },
      { user: rahul._id, dayNumber: 2, title: 'Configure VS Code Workspace & Linting Rules', category: 'Engineering', priority: 'medium', status: 'completed', estimatedMinutes: 35 },
      { user: rahul._id, dayNumber: 2, title: 'Generate Ed25519 SSH Keys & Connect to GitHub Org', category: 'IT', priority: 'high', status: 'completed', estimatedMinutes: 30 },
      { user: rahul._id, dayNumber: 2, title: 'Connect to Company Zero-Trust WireGuard VPN', category: 'IT', priority: 'high', status: 'completed', estimatedMinutes: 25 },
      { user: rahul._id, dayNumber: 2, title: 'Submit Hardware Setup Reimbursement Receipt', category: 'HR', priority: 'low', status: 'completed', estimatedMinutes: 15 },
      
      // Day 3 (Completed & In Progress)
      { user: rahul._id, dayNumber: 3, title: 'Review Microservices & LangGraph Architecture RFC', category: 'Engineering', priority: 'high', status: 'completed', estimatedMinutes: 60 },
      { user: rahul._id, dayNumber: 3, title: 'Review Annual Leave & Attendance Policies', category: 'HR', priority: 'medium', status: 'completed', estimatedMinutes: 20 },
      { user: rahul._id, dayNumber: 3, title: 'Schedule Welcome Sync with Engineering Manager', category: 'HR', priority: 'medium', status: 'completed', estimatedMinutes: 30 },
      
      // In Progress Tasks (3)
      { user: rahul._id, dayNumber: 3, title: 'Configure Local Docker Containers & ChromaDB', category: 'Engineering', priority: 'high', status: 'in_progress', estimatedMinutes: 45 },
      { user: rahul._id, dayNumber: 3, title: 'Review Pull Request & Branch Naming Conventions', category: 'Engineering', priority: 'medium', status: 'in_progress', estimatedMinutes: 30 },
      { user: rahul._id, dayNumber: 4, title: 'Complete Security Awareness Training & Phishing Simulation', category: 'Security', priority: 'high', status: 'in_progress', estimatedMinutes: 45 },

      // Pending / Not Started Tasks (4)
      { user: rahul._id, dayNumber: 4, title: 'Clone Repository & Run Smoke Test Suite', category: 'Engineering', priority: 'high', status: 'not_started', estimatedMinutes: 60 },
      { user: rahul._id, dayNumber: 4, title: 'Attend Sprint Planning & Backlog Refinement Meeting', category: 'Training', priority: 'medium', status: 'not_started', estimatedMinutes: 60 },
      { user: rahul._id, dayNumber: 5, title: 'Pick Up First Good-First-Issue Starter Ticket', category: 'Engineering', priority: 'medium', status: 'not_started', estimatedMinutes: 120 },
      
      // Overdue Task (1)
      { user: rahul._id, dayNumber: 2, title: 'Confirm Emergency Contact Details on HR Portal', category: 'HR', priority: 'low', status: 'not_started', estimatedMinutes: 10, dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    ];

    await OnboardingTask.insertMany(rahulTasks);

    // 5. Initialize Rahul's Progress Record
    await OnboardingProgress.create({
      user: rahul._id,
      overallPercentage: 65,
      totalTasks: 20,
      completedTasks: 13,
      remainingTasks: 7,
      inProgressTasks: 3,
      overdueTasks: 1
    });

    // Also give Elena and Marcus tasks/progress
    for (const emp of otherEmployees) {
      const pct = emp.name === 'Elena Rostova' ? 82 : emp.name === 'Marcus Chen' ? 90 : 45;
      await OnboardingProgress.create({
        user: emp._id,
        overallPercentage: pct,
        totalTasks: 20,
        completedTasks: Math.round(20 * (pct / 100)),
        remainingTasks: 20 - Math.round(20 * (pct / 100)),
        inProgressTasks: 2,
        overdueTasks: pct < 50 ? 1 : 0
      });
    }

    // 6. Create Seed Documents in MongoDB
    const seedDocs = [
      {
        title: 'Employee Leave & Attendance Policy',
        filename: 'Employee_Leave_Policy.pdf',
        originalName: 'Employee_Leave_Policy.pdf',
        department: 'HR',
        category: 'HR',
        fileSize: 45200,
        chunkCount: 5,
        status: 'indexed',
        uploadedBy: admin._id
      },
      {
        title: 'Company Employee Handbook',
        filename: 'Employee_Handbook.pdf',
        originalName: 'Employee_Handbook.pdf',
        department: 'General',
        category: 'General',
        fileSize: 58900,
        chunkCount: 5,
        status: 'indexed',
        uploadedBy: admin._id
      },
      {
        title: 'IT Equipment & Developer Setup Guide',
        filename: 'IT_Setup_Guide.pdf',
        originalName: 'IT_Setup_Guide.pdf',
        department: 'IT',
        category: 'IT',
        fileSize: 51200,
        chunkCount: 5,
        status: 'indexed',
        uploadedBy: admin._id
      },
      {
        title: 'Corporate Information Security Policy',
        filename: 'Information_Security_Policy.pdf',
        originalName: 'Information_Security_Policy.pdf',
        department: 'Security',
        category: 'Security',
        fileSize: 48300,
        chunkCount: 5,
        status: 'indexed',
        uploadedBy: admin._id
      },
      {
        title: 'Software Engineering Guidelines & Best Practices',
        filename: 'Engineering_Development_Guide.pdf',
        originalName: 'Engineering_Development_Guide.pdf',
        department: 'Engineering',
        category: 'Engineering',
        fileSize: 64100,
        chunkCount: 5,
        status: 'indexed',
        uploadedBy: admin._id
      }
    ];

    await Document.insertMany(seedDocs);

    // 7. Seed Rahul's Learning Path
    await LearningPath.create({
      user: rahul._id,
      role: 'Software Developer',
      stages: [
        {
          stage: 'foundation',
          stageLabel: 'FOUNDATION',
          status: 'completed',
          title: 'Git Basics & Development Environment',
          description: 'Mastering local dev tools, corporate Git workflow, branch hygiene, and terminal tooling.',
          estimatedHours: 8,
          modules: [
            { title: 'Local Environment Setup (Node.js & Python)', completed: true },
            { title: 'Git & SSH Key Signing', completed: true },
            { title: 'Company Code Formatting & Linters', completed: true }
          ]
        },
        {
          stage: 'current',
          stageLabel: 'CURRENT',
          status: 'in_progress',
          title: 'Company Development Workflow & CI/CD',
          description: 'Understanding branch protection, Pull Request lifecycle, GitHub Actions, and containerized testing.',
          estimatedHours: 12,
          modules: [
            { title: 'Conventional Commits & PR Etiquette', completed: true },
            { title: 'Docker Local Container Stacks', completed: true },
            { title: 'Automated Testing & Lint Checks', completed: false }
          ]
        },
        {
          stage: 'next',
          stageLabel: 'NEXT',
          status: 'upcoming',
          title: 'Full-Stack Microservices & AI RAG Pipeline',
          description: 'Deep-dive into LangGraph multi-agent orchestration, ChromaDB vector indexing, and Express REST APIs.',
          estimatedHours: 16,
          modules: [
            { title: 'Node.js REST Services & JWT Auth', completed: false },
            { title: 'LangGraph StateGraph & Node Routing', completed: false },
            { title: 'ChromaDB Semantic Search & Source Verification', completed: false }
          ]
        },
        {
          stage: 'upcoming',
          stageLabel: 'UPCOMING',
          status: 'locked',
          title: 'Production Deployment & Observability',
          description: 'Zero-downtime releases, metrics monitoring, structured JSON logging, and incident response.',
          estimatedHours: 10,
          modules: [
            { title: 'Staging vs Production Deployment Cycle', completed: false },
            { title: 'Service Health Monitoring & Grafana', completed: false },
            { title: 'Production Security Compliance', completed: false }
          ]
        }
      ]
    });

    // 8. Seed a sample conversation with verified source answer
    await Conversation.create({
      user: rahul._id,
      title: 'Leave Policy Inquiry',
      messages: [
        {
          sender: 'user',
          text: 'How many days of annual leave do employees receive?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          sender: 'assistant',
          text: 'Full-time employees receive 18 days of paid annual leave per calendar year. Leave is credited on a pro-rata basis at 1.5 days per completed month of service. A maximum of 5 unused annual leave days can be carried forward into the next calendar year.',
          agent: 'HR Agent',
          confidence: 'High',
          reasoning: 'Resolved via HR Agent with verified citation from Employee Leave Policy.',
          sources: [
            {
              document: 'Employee_Leave_Policy.pdf',
              section: 'Annual Leave Policy',
              confidence: 'High',
              similarity: 0.92,
              snippet: 'Full-time employees receive 18 days of paid annual leave per calendar year. Leave is credited on a pro-rata basis at 1.5 days per completed month...'
            }
          ],
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 2000)
        }
      ]
    });

    console.log('[Seed] Database successfully seeded with demo user Rahul Kumar (rahul@company.com), Admin (admin@company.com), sample documents, tasks, and conversations.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
