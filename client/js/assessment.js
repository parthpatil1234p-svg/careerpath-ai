/**
 * assessment.js - Student Profile & Skill Assessment Controller
 *
 * Implements:
 * - 4-step progressive wizard with validation and step navigation
 * - Preloading existing user profile via GET /api/users/me
 * - Interactive interest chip toggling
 * - Category-filtered skill picker with proficiency selects
 * - Submitting assessment payload to PUT /api/assessment
 * - Preserves all existing IDs, fields, and API contracts
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard page (strict student portal isolation)
  if (!window.Auth?.requireStudent()) {
    return;
  }
  window.Auth?.consumePortalAlert();

  // 2. Constants & Data
  const ALL_INTERESTS = [
    // Tech & Engineering (stream: 'engineering')
    { id: 'web development', label: 'Web Development', icon: 'bi-code-slash', stream: 'engineering' },
    { id: 'app development', label: 'Mobile App Development', icon: 'bi-phone', stream: 'engineering' },
    { id: 'artificial intelligence', label: 'Artificial Intelligence & ML', icon: 'bi-cpu', stream: 'engineering' },
    { id: 'cybersecurity', label: 'Cybersecurity & Defense', icon: 'bi-shield-shaded', stream: 'engineering' },
    { id: 'cloud computing', label: 'Cloud Computing & DevOps', icon: 'bi-cloud', stream: 'engineering' },
    { id: 'backend engineering', label: 'Backend & Distributed Systems', icon: 'bi-hdd-network', stream: 'engineering' },
    { id: 'data science', label: 'Data Science & Deep Learning', icon: 'bi-clipboard-data', stream: 'engineering' },
    { id: 'qa testing', label: 'QA & Test Automation', icon: 'bi-check2-circle', stream: 'engineering' },
    { id: 'gaming', label: 'Game Development & 3D', icon: 'bi-controller', stream: 'engineering' },
    { id: 'blockchain', label: 'Blockchain & Web3', icon: 'bi-link-45deg', stream: 'engineering' },
    { id: 'cloud security', label: 'Cloud Security & DevSecOps', icon: 'bi-shield-lock', stream: 'engineering' },
    { id: 'product management', label: 'Technical Product Strategy', icon: 'bi-kanban', streams: ['engineering', 'business'] },

    // Business, Finance & Corporate Operations (stream: 'business')
    { id: 'financial modeling', label: 'Financial Modeling & Valuation', icon: 'bi-cash-coin', stream: 'business' },
    { id: 'finance', label: 'Corporate Finance & Reporting', icon: 'bi-bank', stream: 'business' },
    { id: 'valuation', label: 'DCF Valuation & Investment Analysis', icon: 'bi-calculator', stream: 'business' },
    { id: 'business operations', label: 'Business Operations & RevOps', icon: 'bi-briefcase', stream: 'business' },
    { id: 'management consulting', label: 'Management Consulting & Advisory', icon: 'bi-pie-chart', stream: 'business' },
    { id: 'business strategy', label: 'Corporate Strategy & Scaling', icon: 'bi-graph-up', stream: 'business' },

    // Digital Marketing & Growth (stream: 'marketing')
    { id: 'digital marketing', label: 'Digital Marketing & Growth', icon: 'bi-bullseye', stream: 'marketing' },
    { id: 'advertising', label: 'Paid Ads (Meta, Google, TikTok)', icon: 'bi-badge-ad', stream: 'marketing' },
    { id: 'seo', label: 'SEO & Organic Search Strategy', icon: 'bi-search', stream: 'marketing' },
    { id: 'content marketing', label: 'Content Strategy & Editorial', icon: 'bi-journal-text', streams: ['marketing', 'creative'] },
    { id: 'social media', label: 'Social Media & Community Building', icon: 'bi-megaphone', stream: 'marketing' },
    { id: 'viral growth', label: 'Short-Form Video & Viral Loops', icon: 'bi-fire', stream: 'marketing' },

    // Creative, Media & Design (stream: 'creative')
    { id: 'design', label: 'UI / UX Design & Prototyping', icon: 'bi-palette', streams: ['creative', 'engineering'] },
    { id: 'branding', label: 'Brand Identity & Visual Systems', icon: 'bi-vector-pen', streams: ['creative', 'marketing'] },
    { id: 'motion graphics', label: 'Motion Graphics & After Effects', icon: 'bi-film', stream: 'creative' },
    { id: '3d modeling', label: '3D Modeling & Blender', icon: 'bi-box', stream: 'creative' },
    { id: 'copywriting', label: 'High-Converting Copywriting', icon: 'bi-pen', streams: ['creative', 'marketing'] },
    { id: 'visual storytelling', label: 'Visual Storytelling & Narrative', icon: 'bi-brush', stream: 'creative' },

    // Transferable Cross-Domain
    { id: 'data analysis', label: 'Data Analysis & BI Dashboards', icon: 'bi-graph-up-arrow', streams: ['engineering', 'business'] },
    { id: 'market research', label: 'Market Research & Analytics', icon: 'bi-bar-chart', streams: ['business', 'marketing'] },
    { id: 'problem solving', label: 'Problem Solving & Logic', icon: 'bi-lightbulb', streams: ['engineering', 'business', 'marketing', 'creative', 'cross'] },
  ];

  // Helper: Strictly validate if an interest is permitted in the active stream
  const isInterestAllowedInStream = (interestOrId, stream) => {
    if (!stream || stream === 'cross') return true;
    const id = typeof interestOrId === 'string' ? interestOrId.toLowerCase().trim() : (interestOrId?.id || '').toLowerCase().trim();
    const item = ALL_INTERESTS.find((i) => i.id.toLowerCase() === id);
    if (!item) return false;
    if (item.stream === stream) return true;
    if (Array.isArray(item.streams) && item.streams.includes(stream)) return true;
    return false;
  };

  // ── Authoritative 94-Skill Stream Mapping ───────────────────────
  // Guarantees zero cross-stream contamination: a student in one stream
  // will NEVER see or select skills belonging to an unrelated stream.
  const SKILL_STREAM_MAP = {
    // Frontend (Engineering; html also in marketing for landing pages)
    'html': ['engineering', 'marketing'],
    'css': ['engineering'],
    'javascript': ['engineering'],
    'responsive-design': ['engineering'],
    'react': ['engineering'],
    'bootstrap': ['engineering'],
    'typescript': ['engineering'],
    'next.js': ['engineering'],
    'tailwind-css': ['engineering'],
    'flutter': ['engineering'],

    // Backend (Engineering)
    'node.js': ['engineering'],
    'express.js': ['engineering'],
    'rest-apis': ['engineering'],
    'authentication': ['engineering'],
    'python': ['engineering'],
    'fastapi': ['engineering'],
    'graphql': ['engineering'],
    'java': ['engineering'],
    'spring-boot': ['engineering'],
    'kafka': ['engineering'],
    'csharp': ['engineering'],
    'cpp': ['engineering'],

    // Database (Engineering; sql also in business for data-driven decisions)
    'mongodb': ['engineering'],
    'sql': ['engineering', 'business'],
    'mysql': ['engineering'],
    'database-design': ['engineering'],
    'postgresql': ['engineering'],
    'redis': ['engineering'],

    // Data & Analytics (Engineering, Business, Marketing)
    'excel': ['business', 'marketing', 'engineering'],
    'statistics': ['business', 'engineering', 'marketing'],
    'power-bi': ['business', 'engineering', 'marketing'],
    'data-visualization': ['business', 'engineering', 'marketing'],
    'data-cleaning': ['business', 'engineering'],
    'pandas': ['engineering'],

    // AI & Machine Learning (Engineering)
    'langchain': ['engineering'],
    'generative-ai': ['engineering'],
    'pytorch': ['engineering'],
    'tensorflow': ['engineering'],
    'scikit-learn': ['engineering'],
    'deep-learning': ['engineering'],
    'natural-language-processing': ['engineering'],

    // Security (Engineering)
    'networking': ['engineering'],
    'linux': ['engineering'],
    'cybersecurity-fundamentals': ['engineering'],
    'ethical-hacking': ['engineering'],
    'owasp-basics': ['engineering'],

    // Cloud & DevOps (Engineering)
    'docker': ['engineering'],
    'kubernetes': ['engineering'],
    'aws': ['engineering'],
    'terraform': ['engineering'],
    'firebase': ['engineering'],

    // Mobile (Engineering)
    'react-native': ['engineering'],
    'dart': ['engineering'],

    // QA & Testing (Engineering)
    'cypress': ['engineering'],
    'selenium': ['engineering'],
    'playwright': ['engineering'],
    'postman': ['engineering'],

    // Gaming (Engineering)
    'unity': ['engineering'],
    'unreal-engine': ['engineering'],

    // Web3 & Blockchain (Engineering)
    'solidity': ['engineering'],
    'web3js': ['engineering'],
    'smart-contracts': ['engineering'],

    // Developer Tools & CI/CD (Engineering)
    'git': ['engineering'],
    'github': ['engineering'],
    'ci-cd': ['engineering'],

    // Product & Agile (Engineering & Business)
    'agile-scrum': ['business', 'engineering'],
    'product-management': ['business', 'engineering'],
    'user-stories': ['business', 'engineering'],

    // Finance & Business Operations (Business)
    'financial-modeling': ['business'],
    'dcf-valuation': ['business'],
    'accounting': ['business'],
    'business-operations': ['business'],
    'management-consulting': ['business'],
    'market-research': ['business', 'marketing', 'creative'],

    // Digital Marketing & Growth (Marketing)
    'meta-ads': ['marketing'],
    'google-ads': ['marketing'],
    'seo': ['marketing'],
    'content-marketing': ['marketing', 'creative'],
    'social-media-growth': ['marketing'],
    'google-analytics': ['marketing'],

    // Creative, Media & Design (Creative; figma/visual-design also in engineering/marketing)
    'brand-identity': ['creative', 'marketing'],
    'adobe-illustrator': ['creative'],
    'motion-graphics': ['creative'],
    'copywriting': ['creative', 'marketing'],
    'blender': ['creative'],
    'typography': ['creative'],
    'figma': ['creative', 'engineering'],
    'wireframing': ['creative', 'engineering'],
    'prototyping': ['creative', 'engineering'],
    'user-research': ['creative', 'engineering'],
    'visual-design': ['creative', 'marketing', 'engineering'],

    // Universal Soft Skills (Available across all streams)
    'problem-solving': ['engineering', 'business', 'marketing', 'creative', 'cross'],
    'communication': ['engineering', 'business', 'marketing', 'creative', 'cross'],
    'teamwork': ['engineering', 'business', 'marketing', 'creative', 'cross'],
  };

  // Helper: Strictly validate if a skill is permitted in the active stream
  const isSkillAllowedInStream = (skillOrName, stream) => {
    if (!stream || stream === 'cross') return true;
    const rawKey = typeof skillOrName === 'string' ? skillOrName : (skillOrName?.name || '');
    const key = String(rawKey || '').toLowerCase().trim();
    if (!key) return false;

    // 1. Authoritative lookup in SKILL_STREAM_MAP
    if (SKILL_STREAM_MAP[key]) {
      return SKILL_STREAM_MAP[key].includes(stream);
    }

    // 2. Object properties fallback
    if (typeof skillOrName === 'object') {
      if (skillOrName?.stream === 'universal') return true;
      if (skillOrName?.stream) return skillOrName.stream === stream;
      if (Array.isArray(skillOrName?.streams)) return skillOrName.streams.includes(stream);

      // Category fallback
      const cat = skillOrName?.category;
      if (cat === 'soft-skill') return true;
      if (['frontend', 'backend', 'database', 'cloud', 'security', 'ai', 'mobile', 'testing', 'gaming', 'web3', 'tool'].includes(cat)) {
        return stream === 'engineering';
      }
      if (['finance', 'business'].includes(cat)) {
        return stream === 'business';
      }
      if (['marketing'].includes(cat)) {
        return stream === 'marketing';
      }
      if (['design'].includes(cat)) {
        return stream === 'creative';
      }
    }

    return false;
  };

  const FALLBACK_SKILLS = [
    // Frontend (9)
    { name: 'html', displayName: 'HTML', category: 'frontend', stream: 'engineering' },
    { name: 'css', displayName: 'CSS', category: 'frontend', stream: 'engineering' },
    { name: 'javascript', displayName: 'JavaScript', category: 'frontend', stream: 'engineering' },
    { name: 'responsive-design', displayName: 'Responsive Design', category: 'frontend', stream: 'engineering' },
    { name: 'react', displayName: 'React', category: 'frontend', stream: 'engineering' },
    { name: 'bootstrap', displayName: 'Bootstrap', category: 'frontend', stream: 'engineering' },
    { name: 'typescript', displayName: 'TypeScript', category: 'frontend', stream: 'engineering' },
    { name: 'next.js', displayName: 'Next.js', category: 'frontend', stream: 'engineering' },
    { name: 'tailwind-css', displayName: 'Tailwind CSS', category: 'frontend', stream: 'engineering' },

    // Backend (12)
    { name: 'node.js', displayName: 'Node.js', category: 'backend', stream: 'engineering' },
    { name: 'express.js', displayName: 'Express.js', category: 'backend', stream: 'engineering' },
    { name: 'rest-apis', displayName: 'REST APIs', category: 'backend', stream: 'engineering' },
    { name: 'authentication', displayName: 'Authentication', category: 'backend', stream: 'engineering' },
    { name: 'python', displayName: 'Python', category: 'backend', stream: 'engineering' },
    { name: 'fastapi', displayName: 'FastAPI', category: 'backend', stream: 'engineering' },
    { name: 'graphql', displayName: 'GraphQL', category: 'backend', stream: 'engineering' },
    { name: 'java', displayName: 'Java', category: 'backend', stream: 'engineering' },
    { name: 'spring-boot', displayName: 'Spring Boot', category: 'backend', stream: 'engineering' },
    { name: 'kafka', displayName: 'Apache Kafka', category: 'backend', stream: 'engineering' },
    { name: 'csharp', displayName: 'C# Programming', category: 'backend', stream: 'engineering' },
    { name: 'cpp', displayName: 'C++ Programming', category: 'backend', stream: 'engineering' },

    // Database (6)
    { name: 'mongodb', displayName: 'MongoDB', category: 'database', stream: 'engineering' },
    { name: 'sql', displayName: 'SQL', category: 'database', stream: 'engineering' },
    { name: 'mysql', displayName: 'MySQL', category: 'database', stream: 'engineering' },
    { name: 'database-design', displayName: 'Database Design', category: 'database', stream: 'engineering' },
    { name: 'postgresql', displayName: 'PostgreSQL', category: 'database', stream: 'engineering' },
    { name: 'redis', displayName: 'Redis Caching', category: 'database', stream: 'engineering' },

    // Data & AI (13)
    { name: 'excel', displayName: 'Excel', category: 'data' },
    { name: 'statistics', displayName: 'Statistics', category: 'data' },
    { name: 'power-bi', displayName: 'Power BI', category: 'data' },
    { name: 'data-visualization', displayName: 'Data Visualization', category: 'data' },
    { name: 'data-cleaning', displayName: 'Data Cleaning', category: 'data' },
    { name: 'pandas', displayName: 'Pandas & NumPy', category: 'data', stream: 'engineering' },
    { name: 'langchain', displayName: 'LangChain', category: 'ai', stream: 'engineering' },
    { name: 'generative-ai', displayName: 'Generative AI & LLMs', category: 'ai', stream: 'engineering' },
    { name: 'pytorch', displayName: 'PyTorch', category: 'ai', stream: 'engineering' },
    { name: 'tensorflow', displayName: 'TensorFlow', category: 'ai', stream: 'engineering' },
    { name: 'scikit-learn', displayName: 'Scikit-Learn', category: 'ai', stream: 'engineering' },
    { name: 'deep-learning', displayName: 'Deep Learning', category: 'ai', stream: 'engineering' },
    { name: 'natural-language-processing', displayName: 'NLP', category: 'ai', stream: 'engineering' },

    // Design (5)
    { name: 'figma', displayName: 'Figma', category: 'design' },
    { name: 'wireframing', displayName: 'Wireframing', category: 'design' },
    { name: 'prototyping', displayName: 'Prototyping', category: 'design' },
    { name: 'user-research', displayName: 'User Research', category: 'design' },
    { name: 'visual-design', displayName: 'Visual Design', category: 'design' },

    // Security (5)
    { name: 'networking', displayName: 'Networking', category: 'security', stream: 'engineering' },
    { name: 'linux', displayName: 'Linux', category: 'security', stream: 'engineering' },
    { name: 'cybersecurity-fundamentals', displayName: 'Cybersecurity Fundamentals', category: 'security', stream: 'engineering' },
    { name: 'ethical-hacking', displayName: 'Ethical Hacking', category: 'security', stream: 'engineering' },
    { name: 'owasp-basics', displayName: 'OWASP Basics', category: 'security', stream: 'engineering' },

    // Cloud & DevOps (5)
    { name: 'docker', displayName: 'Docker', category: 'cloud', stream: 'engineering' },
    { name: 'kubernetes', displayName: 'Kubernetes', category: 'cloud', stream: 'engineering' },
    { name: 'aws', displayName: 'AWS Cloud', category: 'cloud', stream: 'engineering' },
    { name: 'terraform', displayName: 'Terraform & IaC', category: 'cloud', stream: 'engineering' },
    { name: 'firebase', displayName: 'Firebase & Firestore', category: 'cloud', stream: 'engineering' },

    // Mobile (3)
    { name: 'flutter', displayName: 'Flutter', category: 'mobile', stream: 'engineering' },
    { name: 'react-native', displayName: 'React Native', category: 'mobile', stream: 'engineering' },
    { name: 'dart', displayName: 'Dart', category: 'mobile', stream: 'engineering' },

    // QA & Testing (4)
    { name: 'cypress', displayName: 'Cypress E2E Testing', category: 'testing', stream: 'engineering' },
    { name: 'selenium', displayName: 'Selenium WebDriver', category: 'testing', stream: 'engineering' },
    { name: 'playwright', displayName: 'Playwright Automation', category: 'testing', stream: 'engineering' },
    { name: 'postman', displayName: 'Postman & API Testing', category: 'testing', stream: 'engineering' },

    // Gaming (2)
    { name: 'unity', displayName: 'Unity Engine', category: 'gaming', stream: 'engineering' },
    { name: 'unreal-engine', displayName: 'Unreal Engine 5', category: 'gaming', stream: 'engineering' },

    // Web3 (3)
    { name: 'solidity', displayName: 'Solidity Smart Contracts', category: 'web3', stream: 'engineering' },
    { name: 'web3js', displayName: 'Web3.js & Ethers.js', category: 'web3', stream: 'engineering' },
    { name: 'smart-contracts', displayName: 'Smart Contract Architecture', category: 'web3', stream: 'engineering' },

    // Product & Management (3)
    { name: 'agile-scrum', displayName: 'Agile & Scrum Methodology', category: 'product' },
    { name: 'product-management', displayName: 'Product Management & PRDs', category: 'product' },
    { name: 'user-stories', displayName: 'User Story Mapping & JIRA', category: 'product' },

    // Business & Finance (6)
    { name: 'financial-modeling', displayName: 'Financial Modeling & Valuation', category: 'finance', stream: 'business' },
    { name: 'dcf-valuation', displayName: 'DCF Valuation & Financial Statements', category: 'finance', stream: 'business' },
    { name: 'accounting', displayName: 'Financial Accounting & Reporting', category: 'finance', stream: 'business' },
    { name: 'business-operations', displayName: 'Business Operations & RevOps', category: 'business', stream: 'business' },
    { name: 'management-consulting', displayName: 'Management Consulting & Strategy', category: 'business', stream: 'business' },
    { name: 'market-research', displayName: 'Market Research & Intelligence', category: 'business', stream: 'business' },

    // Digital Marketing & Growth (6)
    { name: 'meta-ads', displayName: 'Meta Ads Manager & Paid Social', category: 'marketing', stream: 'marketing' },
    { name: 'google-ads', displayName: 'Google Ads & SEM', category: 'marketing', stream: 'marketing' },
    { name: 'seo', displayName: 'SEO & Organic Search Strategy', category: 'marketing', stream: 'marketing' },
    { name: 'content-marketing', displayName: 'Content Marketing & Copywriting', category: 'marketing', stream: 'marketing' },
    { name: 'social-media-growth', displayName: 'Social Media & Viral Growth', category: 'marketing', stream: 'marketing' },
    { name: 'google-analytics', displayName: 'Google Analytics 4 & Attribution', category: 'marketing', stream: 'marketing' },

    // Creative, Media & Design (6)
    { name: 'brand-identity', displayName: 'Brand Identity & Logo Systems', category: 'design', stream: 'creative' },
    { name: 'adobe-illustrator', displayName: 'Adobe Illustrator', category: 'design', stream: 'creative' },
    { name: 'motion-graphics', displayName: 'Motion Graphics & After Effects', category: 'design', stream: 'creative' },
    { name: 'copywriting', displayName: 'High-Converting Copywriting', category: 'design', stream: 'creative' },
    { name: 'blender', displayName: 'Blender 3D Modeling', category: 'design', stream: 'creative' },
    { name: 'typography', displayName: 'Typography & Layout Design', category: 'design', stream: 'creative' },

    // Soft Skills & Tools (6)
    { name: 'git', displayName: 'Git', category: 'tool', stream: 'engineering' },
    { name: 'github', displayName: 'GitHub', category: 'tool', stream: 'engineering' },
    { name: 'ci-cd', displayName: 'CI/CD & GitHub Actions', category: 'tool', stream: 'engineering' },
    { name: 'problem-solving', displayName: 'Problem Solving', category: 'soft-skill' },
    { name: 'communication', displayName: 'Communication', category: 'soft-skill' },
    { name: 'teamwork', displayName: 'Teamwork', category: 'soft-skill' },
  ];

  // 3. State
  const urlParams = new URLSearchParams(window.location.search);
  const streamParam = urlParams.get('stream') || urlParams.get('track');
  const validStreams = ['engineering', 'business', 'marketing', 'creative', 'cross'];
  let selectedStream = (streamParam && validStreams.includes(streamParam)) ? streamParam : 'engineering';
  let allAvailableSkills = [...FALLBACK_SKILLS];
  const selectedInterests = new Set();
  const selectedSkillsMap = new Map(); // key: skillName, value: { name, displayName, proficiency, ... }
  let currentStep = 0;
  let hasCompletedSkillVerification = false; // Ensures quiz gate is only required once per account

  // Reality Check Quiz Constants (All 94 skills eligible; curated bank for instant 0ms launch)
  const BANKED_QUIZ_SKILLS = [
    'javascript', 'python', 'sql', 'react', 'node.js', 'html', 'css',
    'typescript', 'mongodb', 'docker', 'git', 'aws', 'postgresql',
    'express.js', 'tailwind-css', 'next.js', 'fastapi', 'linux', 'rest-apis',
    'redis', 'kubernetes'
  ];
  const AVAILABLE_QUIZ_SKILLS = BANKED_QUIZ_SKILLS; // Kept for backwards compatibility
  const SKILL_ALIASES = {
    'nodejs': 'node.js',
    'node': 'node.js',
    'reactjs': 'react',
    'react.js': 'react',
    'html5': 'html',
    'css3': 'css',
    'js': 'javascript',
    'py': 'python',
    'ts': 'typescript',
    'mongo': 'mongodb',
    'postgres': 'postgresql',
    'k8s': 'kubernetes',
    'tailwind': 'tailwind-css',
    'tailwindcss': 'tailwind-css',
    'express': 'express.js',
    'next': 'next.js',
    'nextjs': 'next.js',
    'tf': 'terraform'
  };
  const normalizeSkillSlug = (raw) => {
    const s = String(raw || '').trim().toLowerCase();
    return SKILL_ALIASES[s] || s;
  };
  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const INTEREST_SKILL_AFFINITY = {
    'web development': ['javascript', 'html', 'css', 'react', 'node.js'],
    'backend engineering': ['node.js', 'python', 'sql'],
    'data analysis': ['python', 'sql'],
    'data science': ['python', 'sql'],
    'artificial intelligence': ['python'],
    'problem solving': ['javascript', 'python', 'sql'],
    'app development': ['react', 'javascript'],
    'cloud computing': ['node.js', 'python'],
    'cloud security': ['python', 'sql'],
    'qa testing': ['javascript', 'python'],
    'design': ['html', 'css']
  };

  // 4. DOM Elements
  const alertContainer = document.getElementById('alertContainer');
  const interestChipsWrapper = document.getElementById('interestChipsWrapper');
  const interestCount = document.getElementById('interestCount');
  const skillsGrid = document.getElementById('skillsGrid');
  const skillSearchInput = document.getElementById('skillSearchInput');
  const skillCategoryFilter = document.getElementById('skillCategoryFilter');
  const selectedSkillsSummary = document.getElementById('selectedSkillsSummary');
  const selectedSkillsCount = document.getElementById('selectedSkillsCount');
  const clearAllSkillsBtn = document.getElementById('clearAllSkillsBtn');
  const form = document.getElementById('assessmentForm');
  const submitBtn = document.getElementById('submitAssessmentBtn');

  // Prove Your Skills Panel Elements
  const proveSkillsPanel = document.getElementById('proveSkillsPanel');
  const proveSkillsSubtitle = document.getElementById('proveSkillsSubtitle');
  const proveSkillsBadge = document.getElementById('proveSkillsBadge');
  const proveSkillsBadgeText = document.getElementById('proveSkillsBadgeText');
  const proveSkillsList = document.getElementById('proveSkillsList');
  const proveSkillsProgressFill = document.getElementById('proveSkillsProgressFill');
  const step3ContinueBtn = document.getElementById('step3ContinueBtn');

  // Skill Check Modal Elements
  const skillCheckModalEl = document.getElementById('skillCheckModal');
  const modalSkillBadge = document.getElementById('modalSkillBadge');
  const modalProviderBadge = document.getElementById('modalProviderBadge');
  const skillCheckModalTitle = document.getElementById('skillCheckModalTitle');
  const modalDifficultyPill = document.getElementById('modalDifficultyPill');
  const modalLoadingState = document.getElementById('modalLoadingState');
  const modalQuestionState = document.getElementById('modalQuestionState');
  const modalVerdictState = document.getElementById('modalVerdictState');
  const modalStepText = document.getElementById('modalStepText');
  const modalStepper = document.getElementById('modalStepper');
  const modalQuestionPrompt = document.getElementById('modalQuestionPrompt');
  const modalCodeSnippet = document.getElementById('modalCodeSnippet');
  const modalOptionsList = document.getElementById('modalOptionsList');
  const modalFeedbackBox = document.getElementById('modalFeedbackBox');
  const modalFeedbackIcon = document.getElementById('modalFeedbackIcon');
  const modalFeedbackHeadline = document.getElementById('modalFeedbackHeadline');
  const modalFeedbackText = document.getElementById('modalFeedbackText');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const modalVerdictSelfClaimed = document.getElementById('modalVerdictSelfClaimed');
  const modalVerdictVerifiedLevel = document.getElementById('modalVerdictVerifiedLevel');
  const modalVerdictExplanation = document.getElementById('modalVerdictExplanation');
  const modalVerdictGapsWrap = document.getElementById('modalVerdictGapsWrap');
  const modalVerdictGaps = document.getElementById('modalVerdictGaps');
  const modalVerdictRetestBtn = document.getElementById('modalVerdictRetestBtn');
  const modalVerdictDoneBtn = document.getElementById('modalVerdictDoneBtn');

  // Step Wizard Elements
  const stepPanels = [
    document.getElementById('stepPanel0'),
    document.getElementById('stepPanel1'),
    document.getElementById('stepPanel2'),
    document.getElementById('stepPanel3'),
    document.getElementById('stepPanel4'),
  ];
  const desktopNavItems = [
    document.getElementById('navStep0'),
    document.getElementById('navStep1'),
    document.getElementById('navStep2'),
    document.getElementById('navStep3'),
    document.getElementById('navStep4'),
  ];
  const mobileStepLabel = document.getElementById('mobileStepLabel');
  const mobileStepPercent = document.getElementById('mobileStepPercent');
  const mobileProgressBar = document.getElementById('mobileProgressBar');

  let currentCategoryFilter = 'all';
  let currentSearchQuery = '';

  const showAlert = (message, type = 'danger') => {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show d-flex align-items-center gap-2 py-3 px-4 shadow-sm mb-4" role="alert">
        <i class="bi ${type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5"></i>
        <div class="small">${escapeHtml(message)}</div>
        <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };
  window.showAlert = showAlert;

  // 5. Step Navigation System
  const STEP_TITLES = [
    'Choose Stream',
    'Academic Background',
    'Domains of Interest',
    'Skills & Proficiency',
    'Career Aspirations',
  ];

  const updateStepUI = (targetStep) => {
    currentStep = targetStep;

    // Show active panel
    stepPanels.forEach((panel, idx) => {
      if (panel) {
        panel.classList.toggle('active', idx === currentStep);
      }
    });

    // Update desktop stepper
    desktopNavItems.forEach((item, idx) => {
      if (item) {
        item.classList.toggle('active', idx === currentStep);
        if (idx < currentStep) {
          item.classList.add('completed');
        } else {
          item.classList.remove('completed');
        }
      }
    });

    // Update mobile progress bar
    if (mobileStepLabel) {
      mobileStepLabel.textContent = `Step ${currentStep} of 4: ${STEP_TITLES[currentStep] || ''}`;
    }
    const pct = currentStep === 0 ? 10 : Math.round((currentStep / 4) * 100);
    if (mobileStepPercent) mobileStepPercent.textContent = `${pct}%`;
    if (mobileProgressBar) {
      mobileProgressBar.style.width = `${pct}%`;
      mobileProgressBar.setAttribute('aria-valuenow', pct);
    }

    // Toggle "Prove Skills" panel visibility: only relevant for engineering/cross tracks
    if (proveSkillsPanel) {
      if (selectedStream !== 'engineering' && selectedStream !== 'cross') {
        proveSkillsPanel.style.display = 'none';
      } else {
        proveSkillsPanel.style.display = '';
      }
    }

    window.scrollTo({ top: 140, behavior: 'smooth' });
  };

  const STREAM_META = {
    engineering: {
      label: 'Engineering & IT',
      badge: 'ENGINEERING TRACK',
      badgeClass: 'badge-teal'
    },
    business: {
      label: 'Business & Finance',
      badge: 'BUSINESS TRACK',
      badgeClass: 'badge-gold'
    },
    marketing: {
      label: 'Digital Marketing & Growth',
      badge: 'MARKETING TRACK',
      badgeClass: 'badge-emerald'
    },
    creative: {
      label: 'Creative & Design',
      badge: 'CREATIVE TRACK',
      badgeClass: 'badge-purple'
    },
    cross: {
      label: 'Cross-Disciplinary Track',
      badge: 'CROSS-TRACK',
      badgeClass: 'badge-teal'
    }
  };

  const updateCategoryFilterPills = () => {
    if (!skillCategoryFilter) return;
    const streamPillMap = {
      engineering: ['all', 'frontend', 'backend', 'data', 'cloud', 'security', 'mobile', 'testing', 'gaming', 'web3', 'product'],
      business: ['all', 'finance', 'product', 'data'],
      marketing: ['all', 'marketing', 'design', 'data'],
      creative: ['all', 'design', 'marketing'],
      cross: null
    };

    const allowedCats = streamPillMap[selectedStream];
    skillCategoryFilter.querySelectorAll('button').forEach((btn) => {
      const cat = btn.getAttribute('data-cat');
      if (!allowedCats || allowedCats.includes(cat)) {
        btn.style.display = '';
      } else {
        btn.style.display = 'none';
      }
    });

    currentCategoryFilter = 'all';
    skillCategoryFilter.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-cat') === 'all');
    });
  };

  // Auto-prune any previously selected interests or skills that do not belong to active stream
  const pruneCrossStreamSelections = () => {
    if (selectedStream === 'cross') return;

    // 1. Prune unallowed interests
    for (const interestId of Array.from(selectedInterests)) {
      if (!isInterestAllowedInStream(interestId, selectedStream)) {
        selectedInterests.delete(interestId);
      }
    }
    if (interestCount) {
      interestCount.textContent = selectedInterests.size;
    }

    // 2. Prune unallowed skills
    for (const [key, skillData] of Array.from(selectedSkillsMap.entries())) {
      if (!isSkillAllowedInStream(skillData || key, selectedStream)) {
        selectedSkillsMap.delete(key);
      }
    }
    updateSelectedSkillsUI();
  };

  // Dynamically update custom skill category options based on active stream
  const updateCustomSkillCategoryDropdown = () => {
    const select = document.getElementById('customSkillCategory');
    if (!select) return;

    const streamCategoryOptions = {
      engineering: [
        { value: 'frontend', label: 'Frontend' },
        { value: 'backend', label: 'Backend' },
        { value: 'database', label: 'Database' },
        { value: 'cloud', label: 'Cloud / DevOps' },
        { value: 'security', label: 'Security' },
        { value: 'ai', label: 'AI / Data' },
        { value: 'mobile', label: 'Mobile' },
        { value: 'testing', label: 'QA / Testing' },
        { value: 'gaming', label: 'Gaming' },
        { value: 'web3', label: 'Web3' },
        { value: 'product', label: 'Product & Agile' },
        { value: 'design', label: 'UI / UX Design' },
        { value: 'tool', label: 'Developer Tool' }
      ],
      business: [
        { value: 'finance', label: 'Corporate Finance & Valuation' },
        { value: 'business', label: 'Business Operations & Consulting' },
        { value: 'product', label: 'Product & Project Management' },
        { value: 'data', label: 'Business Intelligence & Data' },
        { value: 'tool', label: 'Business Tool / Productivity' }
      ],
      marketing: [
        { value: 'marketing', label: 'Digital Marketing & Ads' },
        { value: 'data', label: 'Marketing Analytics & Tracking' },
        { value: 'design', label: 'Content Strategy & Copy' },
        { value: 'tool', label: 'Marketing Tool / CRM' }
      ],
      creative: [
        { value: 'design', label: 'Visual Design & 3D' },
        { value: 'marketing', label: 'Branding & Copywriting' },
        { value: 'tool', label: 'Creative Tool / Software' }
      ],
      cross: [
        { value: 'frontend', label: 'Frontend' },
        { value: 'backend', label: 'Backend' },
        { value: 'database', label: 'Database' },
        { value: 'data', label: 'Data / AI' },
        { value: 'cloud', label: 'Cloud / DevOps' },
        { value: 'security', label: 'Security' },
        { value: 'finance', label: 'Finance & Valuation' },
        { value: 'business', label: 'Business Operations' },
        { value: 'marketing', label: 'Digital Marketing' },
        { value: 'design', label: 'Design & Creative' },
        { value: 'product', label: 'Product Management' },
        { value: 'tool', label: 'Tool / Other' }
      ]
    };

    const options = streamCategoryOptions[selectedStream] || streamCategoryOptions.engineering;
    select.innerHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
  };

  const applyStreamUI = (streamKey) => {
    selectedStream = streamKey || 'engineering';

    // Prune cross-stream selections so foreign interests & skills cannot persist
    pruneCrossStreamSelections();

    // Update stream card active state
    document.querySelectorAll('#streamCardsGrid .stream-card').forEach((card) => {
      const cardStream = card.getAttribute('data-stream');
      card.classList.toggle('selected', cardStream === selectedStream);
    });

    const meta = STREAM_META[selectedStream] || STREAM_META.engineering;
    const labelEl = document.getElementById('selectedStreamLabel');
    if (labelEl) labelEl.textContent = meta.label;

    const badgeEl = document.getElementById('streamBadge');
    if (badgeEl) {
      badgeEl.textContent = meta.badge;
      badgeEl.className = `badge ${meta.badgeClass} small font-mono`;
    }

    if (proveSkillsPanel) {
      if (selectedStream !== 'engineering' && selectedStream !== 'cross') {
        proveSkillsPanel.style.display = 'none';
      } else {
        proveSkillsPanel.style.display = '';
      }
    }

    updateCategoryFilterPills();
    updateCustomSkillCategoryDropdown();
    renderInterests();
    renderSkillsGrid();
  };

  const validateStep = (step) => {
    if (alertContainer) alertContainer.innerHTML = '';
    if (step === 0) {
      if (!selectedStream) {
        showAlert('Please select your primary stream to proceed.');
        return false;
      }
      return true;
    }
    if (step === 1) {
      const fullName = document.getElementById('fullName').value.trim();
      const course = document.getElementById('course').value.trim();
      if (!fullName) {
        showAlert('Please enter your full name.');
        return false;
      }
      if (!course) {
        showAlert('Please enter your degree or course (e.g. BCA, B.Tech, B.Com, BBA, B.Des).');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (selectedInterests.size === 0) {
        showAlert('Please select at least 1 domain of interest before proceeding.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (selectedSkillsMap.size === 0) {
        showAlert('Please select at least 1 skill you possess before proceeding.');
        return false;
      }
      // Non-engineering tracks do not have technical code quizzes: bypass!
      if (selectedStream !== 'engineering' && selectedStream !== 'cross') {
        return true;
      }
      // If account already completed one-time skill verification, never block again!
      if (hasCompletedSkillVerification) {
        return true;
      }
      const required = getRequiredVerificationSkills();
      const verifiedCount = required.filter(s => s.isQuizVerified || s.isCodeVerified).length;
      if (required.length > 0 && verifiedCount < 1) {
        showAlert('Please verify at least 1 of your claimed technical skills (or auto-detect via GitHub) in the "Prove your skills" panel below to continue.', 'warning');
        document.getElementById('proveSkillsPanel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
      return true;
    }
    return true;
  };

  // Wire Step Buttons
  document.getElementById('step0ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(0)) updateStepUI(1);
  });

  document.getElementById('step1BackBtn')?.addEventListener('click', () => {
    updateStepUI(0);
  });
  document.getElementById('step1ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(1)) updateStepUI(2);
  });

  document.getElementById('step2BackBtn')?.addEventListener('click', () => {
    updateStepUI(1);
  });
  document.getElementById('step2ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(2)) updateStepUI(3);
  });

  document.getElementById('step3BackBtn')?.addEventListener('click', () => {
    updateStepUI(2);
  });
  document.getElementById('step3ContinueBtn')?.addEventListener('click', () => {
    if (validateStep(3)) updateStepUI(4);
  });

  document.getElementById('step4BackBtn')?.addEventListener('click', () => {
    updateStepUI(3);
  });

  // Allow clicking desktop stepper items if prior steps are valid
  desktopNavItems.forEach((item, idx) => {
    item?.addEventListener('click', () => {
      const target = idx;
      if (target <= currentStep) {
        updateStepUI(target);
      } else {
        // Validate intermediate steps
        for (let s = currentStep; s < target; s++) {
          if (!validateStep(s)) return;
        }
        updateStepUI(target);
      }
    });
  });

  // Wire stream cards in Step 0
  document.querySelectorAll('#streamCardsGrid .stream-card').forEach((card) => {
    card.addEventListener('click', () => {
      const stream = card.getAttribute('data-stream');
      if (stream) {
        applyStreamUI(stream);
      }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const stream = card.getAttribute('data-stream');
        if (stream) applyStreamUI(stream);
      }
    });
  });

  // 6. Render Interest Chips
  const renderInterests = () => {
    if (!interestChipsWrapper) return;
    interestChipsWrapper.innerHTML = '';

    const visibleInterests = ALL_INTERESTS.filter((interest) => {
      return isInterestAllowedInStream(interest, selectedStream);
    });

    visibleInterests.forEach((interest) => {
      const isSelected = selectedInterests.has(interest.id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `interest-chip ${isSelected ? 'selected' : ''}`;
      chip.innerHTML = `
        <i class="bi ${interest.icon}"></i>
        <span>${interest.label}</span>
      `;

      chip.addEventListener('click', () => {
        if (!isInterestAllowedInStream(interest, selectedStream)) {
          showAlert(`This domain of interest belongs to another stream and cannot be selected in ${STREAM_META[selectedStream]?.label || selectedStream}.`, 'warning');
          return;
        }
        if (selectedInterests.has(interest.id)) {
          selectedInterests.delete(interest.id);
        } else {
          if (selectedInterests.size >= 10) {
            showAlert('You can select a maximum of 10 interests.', 'warning');
            return;
          }
          selectedInterests.add(interest.id);
        }
        renderInterests();
      });

      interestChipsWrapper.appendChild(chip);
    });

    if (interestCount) {
      interestCount.textContent = selectedInterests.size;
    }
  };

  // 7. Render Available Skills Grid
  const renderSkillsGrid = () => {
    if (!skillsGrid) return;
    skillsGrid.innerHTML = '';

    const filtered = allAvailableSkills.filter((skill) => {
      // 1. Strict Stream filter (blocks cross-stream skills from rendering or search matches)
      if (!isSkillAllowedInStream(skill, selectedStream)) return false;

      // 2. Category filter
      const matchesCategory =
        currentCategoryFilter === 'all' ||
        skill.category === currentCategoryFilter ||
        (currentCategoryFilter === 'data' && ['database', 'data', 'ai'].includes(skill.category)) ||
        (currentCategoryFilter === 'cloud' && ['cloud', 'tool'].includes(skill.category)) ||
        (currentCategoryFilter === 'security' && ['security'].includes(skill.category)) ||
        (currentCategoryFilter === 'frontend' && ['frontend', 'mobile'].includes(skill.category)) ||
        (currentCategoryFilter === 'backend' && ['backend', 'database'].includes(skill.category)) ||
        (currentCategoryFilter === 'finance' && ['finance', 'business'].includes(skill.category)) ||
        (currentCategoryFilter === 'marketing' && ['marketing'].includes(skill.category)) ||
        (currentCategoryFilter === 'design' && ['design'].includes(skill.category));

      const matchesSearch =
        !currentSearchQuery ||
        skill.displayName.toLowerCase().includes(currentSearchQuery) ||
        skill.name.toLowerCase().includes(currentSearchQuery);

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      skillsGrid.innerHTML = `
        <div class="col-12 text-center py-4 text-muted small">
          <i class="bi bi-search me-1"></i> No matching skills found for "${escapeHtml(currentSearchQuery)}".
        </div>
      `;
      return;
    }

    filtered.forEach((skill) => {
      const isSelected = selectedSkillsMap.has(skill.name);
      const selectedObj = isSelected ? selectedSkillsMap.get(skill.name) : null;
      const currentProficiency = selectedObj ? selectedObj.proficiency : 'beginner';
      const isCodeVerified = selectedObj?.isCodeVerified;
      const isQuizVerified = selectedObj?.isQuizVerified;
      const skillLogo = window.TechLogos?.getLogoImg(skill.name, { size: 16, className: 'me-1' }) || '';

      let verifiedBadge = '';
      let retestBtnHtml = '';
      if (isQuizVerified) {
        verifiedBadge = `<span class="badge bg-success-subtle text-success border border-success ms-1" title="Verified by Reality Check Quiz" style="padding: 1px 5px; font-size: 0.62rem;"><i class="bi bi-patch-check-fill me-1"></i>Verified (${capitalize(selectedObj.verifiedProficiency || selectedObj.proficiency)})</span>`;
        retestBtnHtml = `<button type="button" class="btn btn-outline-primary btn-sm py-0 px-2 btn-grid-retest ms-1 text-nowrap" data-skill="${escapeHtml(skill.name)}" title="Retest this skill to recalibrate your level" style="font-size: 0.72rem; height: 28px; line-height: 26px;"><i class="bi bi-arrow-repeat me-1"></i>Retest</button>`;
      } else if (isCodeVerified) {
        verifiedBadge = `<span class="badge-code-verified ms-1" title="Verified by real GitHub repo code" style="padding: 1px 4px; font-size: 0.62rem;"><i class="bi bi-github me-1"></i>Code Verified</span>`;
        retestBtnHtml = `<button type="button" class="btn btn-outline-primary btn-sm py-0 px-2 btn-grid-retest ms-1 text-nowrap" data-skill="${escapeHtml(skill.name)}" title="Take quiz to verify with full confidence" style="font-size: 0.72rem; height: 28px; line-height: 26px;"><i class="bi bi-patch-question me-1"></i>Quiz</button>`;
      }

      const col = document.createElement('div');
      col.className = 'col-12 col-lg-6';
      col.innerHTML = `
        <div class="skill-picker-card ${isSelected ? 'active-skill' : ''}">
          <div class="d-flex align-items-center justify-content-between gap-2 w-100">
            <div class="form-check m-0 flex-grow-1 d-flex align-items-center gap-2" style="min-width: 0;">
              <input
                class="form-check-input skill-checkbox flex-shrink-0"
                type="checkbox"
                id="skill_${skill.name}"
                ${isSelected ? 'checked' : ''}
              />
              <label class="form-check-label fw-semibold text-ink m-0 d-inline-flex align-items-center gap-1.5" for="skill_${skill.name}" title="${skill.displayName}" style="min-width: 0; cursor: pointer;">
                ${skillLogo}
                <span class="skill-name-text">${skill.displayName}</span>
                ${verifiedBadge}
              </label>
            </div>
            <div class="d-flex align-items-center gap-1 flex-shrink-0">
              <select class="form-select form-select-sm skill-proficiency-select"
                      aria-label="${skill.displayName} proficiency level"
                      ${!isSelected || isQuizVerified ? 'disabled' : ''}
                      title="${isQuizVerified ? 'Proficiency calibrated by Reality Check quiz (locked)' : ''}">
                <option value="beginner" ${currentProficiency === 'beginner' ? 'selected' : ''}>Beginner</option>
                <option value="intermediate" ${currentProficiency === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                <option value="advanced" ${currentProficiency === 'advanced' ? 'selected' : ''}>Advanced</option>
              </select>
              ${retestBtnHtml}
            </div>
          </div>
        </div>
      `;

      const checkbox = col.querySelector('.skill-checkbox');
      const select = col.querySelector('.skill-proficiency-select');

      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!isSkillAllowedInStream(skill, selectedStream)) {
            e.target.checked = false;
            showAlert(`This skill belongs to another stream and cannot be selected in ${STREAM_META[selectedStream]?.label || selectedStream}.`, 'warning');
            return;
          }
          if (selectedSkillsMap.size >= 20) {
            e.target.checked = false;
            showAlert('You can select a maximum of 20 skills for assessment.', 'warning');
            return;
          }
          const existingUserSkill = (currentUser?.skills || []).find(
            (s) => (s.name || '').toLowerCase() === skill.name.toLowerCase()
          );
          const isQuizVer = Boolean(existingUserSkill?.isQuizVerified);
          const profVal = existingUserSkill?.verifiedProficiency || existingUserSkill?.proficiency || select.value || 'beginner';

          selectedSkillsMap.set(skill.name, {
            name: skill.name,
            displayName: skill.displayName,
            category: skill.category || 'tool',
            proficiency: profVal,
            selfRatedProficiency: existingUserSkill?.selfRatedProficiency || select.value || 'beginner',
            verifiedProficiency: existingUserSkill?.verifiedProficiency || null,
            isQuizVerified: isQuizVer,
            quizScore: existingUserSkill?.quizScore || 0,
            quizGaps: existingUserSkill?.quizGaps || [],
            isCodeVerified: Boolean(existingUserSkill?.isCodeVerified),
            verifiedSource: existingUserSkill?.verifiedSource || 'self'
          });
          select.disabled = isQuizVer;
        } else {
          selectedSkillsMap.delete(skill.name);
          select.disabled = true;
        }
        updateSelectedSkillsUI();
        renderSkillsGrid();
      });

      select.addEventListener('change', (e) => {
        if (selectedSkillsMap.has(skill.name)) {
          selectedSkillsMap.get(skill.name).proficiency = e.target.value;
          updateSelectedSkillsUI();
        }
      });

      const gridRetestBtn = col.querySelector('.btn-grid-retest');
      if (gridRetestBtn) {
        gridRetestBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          startSkillCheck(skill.name);
        });
      }

      skillsGrid.appendChild(col);
    });
  };

  // 8. Update Selected Skills Summary Box
  const updateSelectedSkillsUI = () => {
    if (selectedSkillsCount) {
      selectedSkillsCount.textContent = selectedSkillsMap.size;
    }

    if (!selectedSkillsSummary) return;

    if (selectedSkillsMap.size === 0) {
      selectedSkillsSummary.innerHTML = `
        <span class="text-muted small fst-italic">No skills selected yet. Click any skill above to add it.</span>
      `;
      renderProveSkillsPanel();
      return;
    }

    selectedSkillsSummary.innerHTML = '';
    selectedSkillsMap.forEach((skill) => {
      const pill = document.createElement('span');
      pill.className = 'badge badge-navy border d-inline-flex align-items-center gap-1 py-1 px-2 small';
      let verifiedTag = '';
      if (skill.isQuizVerified) {
        verifiedTag = `<span class="badge bg-success-subtle text-success border border-success ms-1 cursor-pointer retest-pill-badge" role="button" data-skill="${escapeHtml(skill.name)}" title="Verified by Quiz - Click to Retest" style="padding: 1px 5px; font-size: 0.62rem; cursor: pointer;"><i class="bi bi-patch-check-fill"></i> Verified <i class="bi bi-arrow-repeat text-primary ms-0.5"></i></span>`;
      } else if (skill.isCodeVerified) {
        verifiedTag = `<span class="badge-code-verified ms-1 cursor-pointer retest-pill-badge" role="button" data-skill="${escapeHtml(skill.name)}" title="Verified by GitHub Repo Code - Click to Quiz" style="padding: 1px 4px; font-size: 0.62rem; cursor: pointer;"><i class="bi bi-github"></i> Verified <i class="bi bi-arrow-repeat ms-0.5"></i></span>`;
      }

      const rawProf = String(skill.verifiedProficiency || skill.proficiency || 'intermediate');
      const shortProf = rawProf.slice(0, 3);

      const skillLogo = window.TechLogos?.getLogoImg(skill.name, { size: 14, className: 'me-1' }) || '';
      pill.innerHTML = `
        ${skillLogo}
        <span class="fw-semibold text-ink">${escapeHtml(skill.displayName || skill.name)}</span>
        <span class="text-primary fw-bold" style="font-size: 0.7rem;">(${escapeHtml(shortProf)})</span>
        ${verifiedTag}
        <i class="bi bi-x ms-1 cursor-pointer" title="Remove" style="cursor: pointer;"></i>
      `;

      const retestBadge = pill.querySelector('.retest-pill-badge');
      if (retestBadge) {
        retestBadge.addEventListener('click', (e) => {
          e.stopPropagation();
          startSkillCheck(skill.name);
        });
      }

      pill.querySelector('.bi-x').addEventListener('click', () => {
        selectedSkillsMap.delete(skill.name);
        updateSelectedSkillsUI();
        renderSkillsGrid();
      });

      selectedSkillsSummary.appendChild(pill);
    });

    renderProveSkillsPanel();
  };

  // --- Verification Gate: Prove Your Skills Panel Logic ---
  const getRequiredVerificationSkills = () => {
    const candidates = [];
    selectedSkillsMap.forEach((s) => {
      const norm = normalizeSkillSlug(s.name);
      const isBanked = AVAILABLE_QUIZ_SKILLS.includes(norm);
      const profStr = String(s.verifiedProficiency || s.proficiency || '').toLowerCase();
      const selfProfStr = String(s.selfRatedProficiency || '').toLowerCase();
      const isVerified = Boolean(s.isQuizVerified || s.isCodeVerified);
      const isLevelEligible =
        ['intermediate', 'advanced'].includes(profStr) ||
        ['intermediate', 'advanced'].includes(selfProfStr) ||
        isVerified;

      if (isLevelEligible) {
        let score = 0;
        // Prioritize already-verified skills so they ALWAYS remain visible with their checkmarks!
        if (isVerified) {
          score += 1000;
        }
        // Banked skills get a slight affinity boost for 0ms loading
        if (isBanked) {
          score += 20;
        }
        selectedInterests.forEach((interest) => {
          const affinity = INTEREST_SKILL_AFFINITY[interest] || [];
          if (affinity.includes(norm)) score += 10;
        });
        const levelToCheck = String(s.selfRatedProficiency || s.proficiency || '').toLowerCase();
        if (levelToCheck === 'advanced') score += 5;
        else if (levelToCheck === 'intermediate') score += 2;

        candidates.push({ key: s.name, norm, skill: s, score, isVerified, isBanked });
      }
    });

    // If all skills are self-rated beginner, include them as baseline candidates
    if (candidates.length === 0 && selectedSkillsMap.size > 0) {
      selectedSkillsMap.forEach((s) => {
        const norm = normalizeSkillSlug(s.name);
        const isBanked = AVAILABLE_QUIZ_SKILLS.includes(norm);
        candidates.push({ key: s.name, norm, skill: s, score: isBanked ? 20 : 0, isVerified: false, isBanked });
      });
    }

    // Sort by verified first, then score descending, then alphabetical
    candidates.sort((a, b) => {
      if (a.isVerified !== b.isVerified) {
        return a.isVerified ? -1 : 1;
      }
      return b.score - a.score || (a.skill.displayName || a.skill.name).localeCompare(b.skill.displayName || b.skill.name);
    });

    // Always include ALL verified skills that are selected, plus unverified ones up to at least 3 items total
    const verifiedList = candidates.filter(c => c.isVerified).map(c => c.skill);
    const unverifiedList = candidates.filter(c => !c.isVerified).map(c => c.skill);

    const neededUnverified = Math.max(0, 3 - verifiedList.length);
    return [...verifiedList, ...unverifiedList.slice(0, neededUnverified)];
  };

  const renderProveSkillsPanel = () => {
    if (!proveSkillsPanel || !proveSkillsList) return;

    const requiredSkills = getRequiredVerificationSkills();
    const verifiedCount = requiredSkills.filter(s => s.isQuizVerified || s.isCodeVerified).length;
    const isCompleted = hasCompletedSkillVerification || (requiredSkills.length > 0 && verifiedCount >= 1);

    // Check if this account has completed skill verification
    if (isCompleted) {
      hasCompletedSkillVerification = true;
      const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                          (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
      if (currentUser && !currentUser.hasCompletedSkillVerification) {
        currentUser.hasCompletedSkillVerification = true;
        if (typeof window.Auth?.setCurrentUser === 'function') {
          window.Auth.setCurrentUser(currentUser);
        }
        if (typeof window.Auth?.initNav === 'function') {
          window.Auth.initNav();
        }
      }

      if (proveSkillsBadge) {
        proveSkillsBadge.className = 'prove-skills-badge completed';
      }
      if (proveSkillsBadgeText) {
        proveSkillsBadgeText.textContent = 'Account Verified \u2713';
      }
      if (proveSkillsProgressFill) {
        proveSkillsProgressFill.style.width = '100%';
        proveSkillsProgressFill.className = 'prove-skills-progress-fill completed';
      }
      if (proveSkillsSubtitle) {
        proveSkillsSubtitle.textContent = 'Your account has verified technical skills. Dashboard, Recommendations, and Active Roadmap are fully unlocked!';
      }
      proveSkillsPanel.classList.add('all-verified');

      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = false;
        step3ContinueBtn.title = 'Continue to Goals';
        step3ContinueBtn.classList.remove('opacity-50');
      }

      // Render Skill Rows
      proveSkillsList.innerHTML = '';
      requiredSkills.forEach((skill) => {
        const isQuizVer = !!skill.isQuizVerified;
        const isCodeVer = !!skill.isCodeVerified;
        const isVerified = isQuizVer || isCodeVer;
        const profStr = String(skill.verifiedProficiency || skill.proficiency || 'intermediate');
        const profClass = profStr.toLowerCase();

        const row = document.createElement('div');
        row.className = `prove-skill-item ${isVerified ? 'item-verified' : ''}`;

        let actionHtml = '';
        if (isQuizVer) {
          actionHtml = `
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="badge bg-success text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm">
                <i class="bi bi-patch-check-fill"></i>
                <span>Verified (${escapeHtml(capitalize(profStr))}) \u2713</span>
              </span>
              <button type="button" class="btn-retest-check" data-skill="${escapeHtml(skill.name)}" title="Retest this skill to recalibrate your level">
                <i class="bi bi-arrow-repeat"></i>
                <span>Retest</span>
              </button>
            </div>
          `;
        } else if (isCodeVer) {
          actionHtml = `
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="badge bg-secondary text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm" title="Verified from connected GitHub repository code">
                <i class="bi bi-github"></i>
                <span>GitHub-Supported \u2713</span>
              </span>
              <button type="button" class="btn-retest-check" data-skill="${escapeHtml(skill.name)}" title="Take reality check quiz to verify with full confidence">
                <i class="bi bi-patch-question"></i>
                <span>Take Quiz</span>
              </button>
            </div>
          `;
        } else {
          actionHtml = `
            <button type="button" class="btn-start-check" data-skill="${escapeHtml(skill.name)}" style="background: #475569;" title="Optional practice check - will not block progress">
              <i class="bi bi-play-circle"></i>
              <span>Practice check (Optional)</span>
            </button>
          `;
        }

        let noteHtml = '';
        const selfRatedStr = String(skill.selfRatedProficiency || '').toLowerCase();
        if (isQuizVer && selfRatedStr && selfRatedStr !== profClass) {
          const gapText = skill.quizGaps && skill.quizGaps.length > 0 ? ` Focus on: ${escapeHtml(skill.quizGaps.slice(0, 2).join(', '))}.` : '';
          noteHtml = `
            <div class="skill-adjusted-note">
              <i class="bi bi-info-circle text-primary me-1"></i>
              <span>You claimed <strong>${escapeHtml(capitalize(skill.selfRatedProficiency))}</strong>, quiz calibrated to <strong>${escapeHtml(capitalize(profStr))}</strong>.${gapText}</span>
            </div>
          `;
        }

        const checkmarkIcon = isVerified
          ? `<i class="bi bi-patch-check-fill text-success fs-5 flex-shrink-0" title="Verified Skill \u2713"></i>`
          : `<div class="prove-skill-dot"></div>`;

        const verifiedTag = isVerified
          ? `<span class="badge bg-success-subtle text-success border border-success-subtle py-0.5 px-2 ms-1" style="font-size: 0.72rem;"><i class="bi bi-check-lg me-1"></i>Verified</span>`
          : '';

        row.innerHTML = `
          <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
            <div class="prove-skill-info">
              ${checkmarkIcon}
              <span class="prove-skill-name">${escapeHtml(skill.displayName || skill.name)}</span>
              ${verifiedTag}
              <span class="prove-skill-level ${escapeHtml(profClass)}">${escapeHtml(capitalize(profStr))}</span>
            </div>
            <div class="prove-skill-action">
              ${actionHtml}
            </div>
          </div>
          ${noteHtml}
        `;

        const checkBtn = row.querySelector('.btn-start-check');
        if (checkBtn) {
          checkBtn.addEventListener('click', () => {
            startSkillCheck(skill.name);
          });
        }

        const retestBtn = row.querySelector('.btn-retest-check');
        if (retestBtn) {
          retestBtn.addEventListener('click', () => {
            startSkillCheck(skill.name);
          });
        }

        proveSkillsList.appendChild(row);
      });
      return;
    }

    // When 0 skills need verification (e.g. only beginner or unbanked skills)
    if (requiredSkills.length === 0) {
      if (proveSkillsBadge) {
        proveSkillsBadge.className = 'prove-skills-badge skipped';
      }
      if (proveSkillsBadgeText) {
        proveSkillsBadgeText.textContent = 'No verification required';
      }
      if (proveSkillsProgressFill) {
        proveSkillsProgressFill.style.width = '100%';
        proveSkillsProgressFill.className = 'prove-skills-progress-fill completed';
      }
      if (proveSkillsSubtitle) {
        proveSkillsSubtitle.textContent = "All your selected skills are beginner level or don't require verification. You're ready to proceed to Goals!";
      }
      proveSkillsPanel.classList.remove('all-verified');

      proveSkillsList.innerHTML = `
        <div class="text-muted small py-2 fst-italic">
          <i class="bi bi-check-circle-fill text-success me-1"></i> No Intermediate or Advanced technical claims requiring reality-check verification. You can proceed directly to Goals.
        </div>
      `;

      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = false;
        step3ContinueBtn.title = 'Continue to Goals';
        step3ContinueBtn.classList.remove('opacity-50');
      }
      return;
    }

    const targetTotal = Math.min(1, requiredSkills.length);
    const isAllComplete = verifiedCount >= targetTotal;
    const pct = Math.min(100, Math.round((verifiedCount / Math.max(1, targetTotal)) * 100));

    if (proveSkillsBadge) {
      proveSkillsBadge.className = `prove-skills-badge ${isAllComplete ? 'completed' : ''}`;
    }
    if (proveSkillsBadgeText) {
      proveSkillsBadgeText.textContent = isAllComplete
        ? `Progress: ${verifiedCount} skill(s) verified \u2713`
        : `Progress: 0 of 1 verified`;
    }
    if (proveSkillsProgressFill) {
      proveSkillsProgressFill.style.width = isAllComplete ? '100%' : `${pct}%`;
      proveSkillsProgressFill.className = `prove-skills-progress-fill ${isAllComplete ? 'completed' : ''}`;
    }
    if (proveSkillsSubtitle) {
      proveSkillsSubtitle.textContent = isAllComplete
        ? 'Great job! Claimed skill verified with 100% confidence. You can now continue to Goals, or verify more skills below for highest match precision.'
        : `Verify at least 1 of your strongest technical skills below to continue to Goals (~90-second reality check).`;
    }

    if (isAllComplete) {
      proveSkillsPanel.classList.add('all-verified');
      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = false;
        step3ContinueBtn.title = 'Continue to Goals';
        step3ContinueBtn.classList.remove('opacity-75');
      }
    } else {
      proveSkillsPanel.classList.remove('all-verified');
      if (step3ContinueBtn) {
        step3ContinueBtn.disabled = false;
        step3ContinueBtn.title = 'Verify at least 1 skill below to continue to Goals';
      }
    }

    // Render Skill Rows
    proveSkillsList.innerHTML = '';
    requiredSkills.forEach((skill) => {
      const isQuizVer = !!skill.isQuizVerified;
      const isCodeVer = !!skill.isCodeVerified;
      const isVerified = isQuizVer || isCodeVer;
      const profStr = String(skill.verifiedProficiency || skill.proficiency || 'intermediate');
      const profClass = profStr.toLowerCase();

      const row = document.createElement('div');
      row.className = `prove-skill-item ${isVerified ? 'item-verified' : ''}`;

      let actionHtml = '';
      const isFlagged = skill.verificationStatus === 'flagged_cheating';
      const isCooldown = Boolean(skill.cooldownActive || (skill.nextRetakeAvailableAt && new Date() < new Date(skill.nextRetakeAvailableAt)));
      const remainingHours = skill.cooldownRemainingHours || (skill.nextRetakeAvailableAt ? Math.max(1, Math.ceil((new Date(skill.nextRetakeAvailableAt) - new Date()) / (1000 * 60 * 60))) : 24);

      if (isFlagged || isCooldown) {
        actionHtml = `
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="badge bg-danger-subtle text-danger border border-danger-subtle py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm" title="Locked due to proctoring violation">
              <i class="bi bi-lock-fill"></i>
              <span>Locked &middot; ${remainingHours}h Cooldown</span>
            </span>
            <button type="button" class="btn btn-outline-danger btn-sm" disabled title="24-hour retake lockout active">
              <i class="bi bi-slash-circle me-1"></i> Disqualified
            </button>
          </div>
        `;
      } else if (isQuizVer) {
        actionHtml = `
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="badge bg-success text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm">
              <i class="bi bi-patch-check-fill"></i>
              <span>Verified (${escapeHtml(capitalize(profStr))}) \u2713</span>
            </span>
            <button type="button" class="btn-retest-check" data-skill="${escapeHtml(skill.name)}" title="Retest this skill to recalibrate your level">
              <i class="bi bi-arrow-repeat"></i>
              <span>Retest</span>
            </button>
          </div>
        `;
      } else if (isCodeVer) {
        actionHtml = `
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <span class="badge bg-secondary text-white py-1.5 px-3 small d-inline-flex align-items-center gap-1 font-mono shadow-sm" title="Verified from connected GitHub repository code">
              <i class="bi bi-github"></i>
              <span>GitHub-Supported \u2713</span>
            </span>
            <button type="button" class="btn-retest-check" data-skill="${escapeHtml(skill.name)}" title="Take reality check quiz to verify with full confidence">
              <i class="bi bi-patch-question"></i>
              <span>Take Quiz</span>
            </button>
          </div>
        `;
      } else {
        actionHtml = `
          <button type="button" class="btn-start-check" data-skill="${escapeHtml(skill.name)}">
            <i class="bi bi-play-circle-fill"></i>
            <span>Start check (90s)</span>
          </button>
        `;
      }

      let noteHtml = '';
      const selfRatedStr = String(skill.selfRatedProficiency || '').toLowerCase();
      if (isFlagged) {
        noteHtml = `
          <div class="skill-adjusted-note text-danger border-danger-subtle bg-danger-subtle">
            <i class="bi bi-exclamation-triangle-fill text-danger me-1"></i>
            <span><strong>Integrity Violation:</strong> 3 proctoring strikes recorded. Retake locked for ${remainingHours} hours.</span>
          </div>
        `;
      } else if (isQuizVer && selfRatedStr && selfRatedStr !== profClass) {
        const gapText = skill.quizGaps && skill.quizGaps.length > 0 ? ` Focus on: ${escapeHtml(skill.quizGaps.slice(0, 2).join(', '))}.` : '';
        noteHtml = `
          <div class="skill-adjusted-note">
            <i class="bi bi-info-circle text-primary me-1"></i>
            <span>You claimed <strong>${escapeHtml(capitalize(skill.selfRatedProficiency))}</strong>, quiz calibrated to <strong>${escapeHtml(capitalize(profStr))}</strong>.${gapText}</span>
          </div>
        `;
      }

      const checkmarkIcon = isVerified
        ? `<i class="bi bi-patch-check-fill text-success fs-5 flex-shrink-0" title="Verified Skill \u2713"></i>`
        : `<div class="prove-skill-dot"></div>`;

      const verifiedTag = isVerified
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle py-0.5 px-2 ms-1" style="font-size: 0.72rem;"><i class="bi bi-check-lg me-1"></i>Verified</span>`
        : '';

      row.innerHTML = `
        <div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
          <div class="prove-skill-info">
            ${checkmarkIcon}
            <span class="prove-skill-name">${escapeHtml(skill.displayName || skill.name)}</span>
            ${verifiedTag}
            <span class="prove-skill-level ${escapeHtml(profClass)}">${escapeHtml(capitalize(profStr))}</span>
          </div>
          <div class="prove-skill-action">
            ${actionHtml}
          </div>
        </div>
        ${noteHtml}
      `;

      const checkBtn = row.querySelector('.btn-start-check');
      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          startSkillCheck(skill.name);
        });
      }

      const retestBtn = row.querySelector('.btn-retest-check');
      if (retestBtn) {
        retestBtn.addEventListener('click', () => {
          startSkillCheck(skill.name);
        });
      }

      proveSkillsList.appendChild(row);
    });
  };

  // --- Skill Check In-Page Modal Logic ---
  let activeQuizSession = null;
  let activeQuestion = null;
  let activeQuestionStep = 1;
  let activeSelectedOptionIndex = null;
  let activeQuizSummary = null;

  // Anti-Cheating & Proctoring Telemetry State (Pillars 2, 5, 6)
  const modalQuizTimerBadge = document.getElementById('modalQuizTimerBadge');
  const modalQuizTimerSeconds = document.getElementById('modalQuizTimerSeconds');
  const modalQuizTimerProgressBar = document.getElementById('modalQuizTimerProgressBar');
  const modalProctorAlert = document.getElementById('modalProctorAlert');
  const modalProctorAlertText = document.getElementById('modalProctorAlertText');
  const modalVerdictIntegrityBadge = document.getElementById('modalVerdictIntegrityBadge');
  const modalVerdictUnconfirmedNotice = document.getElementById('modalVerdictUnconfirmedNotice');
  const modalStrikesBadge = document.getElementById('modalStrikesBadge');
  const modalStrikesCount = document.getElementById('modalStrikesCount');
  const modalStrikeOverlay = document.getElementById('modalStrikeOverlay');
  const strikeView1 = document.getElementById('strikeView1');
  const strikeView2 = document.getElementById('strikeView2');
  const strikeView3 = document.getElementById('strikeView3');
  const strikeReasonText1 = document.getElementById('strikeReasonText1');
  const strikeReasonText2 = document.getElementById('strikeReasonText2');
  const modalStrike1AckBtn = document.getElementById('modalStrike1AckBtn');
  const modalStrike2AckBtn = document.getElementById('modalStrike2AckBtn');
  const modalDisqualifiedDoneBtn = document.getElementById('modalDisqualifiedDoneBtn');

  const MODAL_QUESTION_TIME_LIMIT = 45;
  let modalTimerInterval = null;
  let modalRemainingSeconds = MODAL_QUESTION_TIME_LIMIT;
  let modalQuestionStartTime = Date.now();
  let modalTabSwitchesCount = 0;
  let modalStrikes = 0;
  let isModalDisqualified = false;
  let isModalStrikeActive = false;
  let activeCheckingSkillName = null;
  let lastModalViolationTime = 0;

  const stopModalQuestionTimer = () => {
    if (modalTimerInterval) {
      clearInterval(modalTimerInterval);
      modalTimerInterval = null;
    }
  };

  const startModalQuestionTimer = (resumeSeconds) => {
    stopModalQuestionTimer();
    modalRemainingSeconds = typeof resumeSeconds === 'number' ? resumeSeconds : MODAL_QUESTION_TIME_LIMIT;
    modalQuestionStartTime = Date.now();

    if (modalQuizTimerSeconds) modalQuizTimerSeconds.textContent = modalRemainingSeconds;
    if (modalQuizTimerProgressBar) {
      const pct = Math.max(0, (modalRemainingSeconds / MODAL_QUESTION_TIME_LIMIT) * 100);
      modalQuizTimerProgressBar.style.width = `${pct}%`;
    }
    if (modalQuizTimerBadge) modalQuizTimerBadge.className = 'quiz-timer-badge';

    modalTimerInterval = setInterval(() => {
      modalRemainingSeconds--;
      if (modalQuizTimerSeconds) modalQuizTimerSeconds.textContent = Math.max(0, modalRemainingSeconds);
      if (modalQuizTimerProgressBar) {
        const pct = Math.max(0, (modalRemainingSeconds / MODAL_QUESTION_TIME_LIMIT) * 100);
        modalQuizTimerProgressBar.style.width = `${pct}%`;
      }

      if (modalQuizTimerBadge) {
        if (modalRemainingSeconds <= 10) {
          modalQuizTimerBadge.className = 'quiz-timer-badge danger';
        } else if (modalRemainingSeconds <= 15) {
          modalQuizTimerBadge.className = 'quiz-timer-badge warning';
        } else {
          modalQuizTimerBadge.className = 'quiz-timer-badge';
        }
      }

      if (modalRemainingSeconds <= 0) {
        stopModalQuestionTimer();
        if (modalSubmitBtn && !modalSubmitBtn.classList.contains('d-none')) {
          if (activeSelectedOptionIndex === null) {
            activeSelectedOptionIndex = 0;
            const firstCard = modalOptionsList?.querySelector('.quiz-option-card');
            if (firstCard) firstCard.classList.add('selected');
          }
          modalSubmitBtn.disabled = false;
          modalSubmitBtn.click();
        }
      }
    }, 1000);
  };

  const updateModalStrikesHud = () => {
    const count = Math.min(3, modalStrikes);
    const countEl = document.getElementById('modalStrikesCount');
    if (countEl) countEl.textContent = count;

    const badge = document.getElementById('modalStrikesBadge');
    if (badge) {
      if (count === 0) {
        badge.className = 'badge bg-success-subtle text-success border border-success-subtle font-mono px-2.5 py-1';
        badge.innerHTML = `<i class="bi bi-shield-check me-1"></i> Strikes: <span id="modalStrikesCount">0</span>/3`;
      } else if (count === 1) {
        badge.className = 'badge bg-warning-subtle text-warning border border-warning-subtle font-mono px-2.5 py-1';
        badge.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i> Strikes: <span id="modalStrikesCount">1</span>/3`;
      } else if (count === 2) {
        badge.className = 'badge bg-danger-subtle text-danger border border-danger-subtle font-mono px-2.5 py-1';
        badge.innerHTML = `<i class="bi bi-shield-slash-fill me-1"></i> Strikes: <span id="modalStrikesCount">2</span>/3`;
      } else {
        badge.className = 'badge bg-danger text-white border border-danger font-mono px-2.5 py-1';
        badge.innerHTML = `<i class="bi bi-lock-fill me-1"></i> 3/3 DISQUALIFIED`;
      }
    }
  };

  const triggerModalStrictStrike = async (violationType, description) => {
    // Only monitor if the skillCheckModal is currently open and an active question is displayed
    if (
      !skillCheckModalEl?.classList.contains('show') ||
      !modalQuestionState ||
      modalQuestionState.classList.contains('d-none') ||
      isModalDisqualified ||
      isModalStrikeActive
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastModalViolationTime < 800) {
      return; // Debounce rapid consecutive events (e.g. blur followed immediately by visibilitychange)
    }
    lastModalViolationTime = now;

    isModalStrikeActive = true;
    modalStrikes++;
    modalTabSwitchesCount = modalStrikes;

    // Immediately FREEZE the question countdown timer
    stopModalQuestionTimer();

    // Deduct 10 seconds from clock
    modalRemainingSeconds = Math.max(5, modalRemainingSeconds - 10);
    if (modalQuizTimerSeconds) {
      modalQuizTimerSeconds.textContent = modalRemainingSeconds;
      modalQuizTimerBadge?.classList.add('timer-penalty-flash');
      setTimeout(() => modalQuizTimerBadge?.classList.remove('timer-penalty-flash'), 700);
    }
    if (modalQuizTimerProgressBar) {
      const pct = Math.max(0, (modalRemainingSeconds / MODAL_QUESTION_TIME_LIMIT) * 100);
      modalQuizTimerProgressBar.style.width = `${pct}%`;
    }

    // Authoritative Server Violation Sync
    try {
      if (window.API && activeCheckingSkillName) {
        window.API.post('/quiz/violation', {
          skill: activeCheckingSkillName,
          violationType,
          details: { message: description, timestamp: now }
        }, { auth: true }).catch((e) => console.warn('[StrictProctor] Background violation report warning:', e.message));
      }
    } catch (_) {}

    // Update Live Strike HUD Badge in Header
    updateModalStrikesHud();

    // Show high-impact strike overlay
    const overlay = document.getElementById('modalStrikeOverlay');
    const v1 = document.getElementById('strikeView1');
    const v2 = document.getElementById('strikeView2');
    const v3 = document.getElementById('strikeView3');

    if (overlay) overlay.classList.remove('d-none');
    v1?.classList.add('d-none');
    v2?.classList.add('d-none');
    v3?.classList.add('d-none');

    if (modalStrikes === 1) {
      const r1 = document.getElementById('strikeReasonText1');
      if (r1) r1.textContent = `${description}. 10 seconds deducted from your timer and integrity score penalized.`;
      v1?.classList.remove('d-none');
    } else if (modalStrikes === 2) {
      const r2 = document.getElementById('strikeReasonText2');
      if (r2) r2.textContent = `${description}. Second violation logged! Another 10 seconds deducted. ONE MORE STRIKE AND YOU WILL BE DISQUALIFIED.`;
      v2?.classList.remove('d-none');
    } else if (modalStrikes >= 3) {
      // STRIKE 3: IMMEDIATE TERMINATION & 24H LOCKOUT
      isModalDisqualified = true;
      v3?.classList.remove('d-none');

      // Guarantee minimum height on modal elements to prevent collapse
      const modalContentEl = skillCheckModalEl?.querySelector('.modal-content');
      if (modalContentEl) modalContentEl.style.minHeight = '560px';
      const modalBodyEl = document.getElementById('modalQuizBody');
      if (modalBodyEl) modalBodyEl.style.minHeight = '480px';

      // Wipe/hide question state
      modalQuestionState?.classList.add('d-none');

      // Call authoritative backend disqualify endpoint
      try {
        if (window.API && activeCheckingSkillName) {
          await window.API.post('/quiz/disqualify', {
            skill: activeCheckingSkillName,
            strikes: 3,
            reason: description || 'REPEATED_PROCTORING_VIOLATIONS'
          }, { auth: true });
        }
      } catch (err) {
        console.error('[StrictProctor] Disqualify API error:', err);
      }

      // Update local skill record
      const targetSk = selectedSkillsMap.get(activeCheckingSkillName) ||
        Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === (activeCheckingSkillName || '').toLowerCase());
      if (targetSk) {
        targetSk.isQuizVerified = false;
        targetSk.quizScore = 0;
        targetSk.integrityScore = 0;
        targetSk.verificationStatus = 'flagged_cheating';
        targetSk.cooldownActive = true;
        targetSk.cooldownRemainingHours = 24;
        targetSk.nextRetakeAvailableAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }
  };

  // Wire Acknowledgement Buttons for Strike Overlays
  document.getElementById('modalStrike1AckBtn')?.addEventListener('click', () => {
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    isModalStrikeActive = false;
    startModalQuestionTimer(modalRemainingSeconds);
  });

  document.getElementById('modalStrike2AckBtn')?.addEventListener('click', () => {
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    isModalStrikeActive = false;
    startModalQuestionTimer(modalRemainingSeconds);
  });

  document.getElementById('modalDisqualifiedDoneBtn')?.addEventListener('click', () => {
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    const modalContentEl = skillCheckModalEl?.querySelector('.modal-content');
    if (modalContentEl) modalContentEl.style.minHeight = '';
    const modalBodyEl = document.getElementById('modalQuizBody');
    if (modalBodyEl) modalBodyEl.style.minHeight = '';
    const modalInstance = bootstrap.Modal.getInstance(skillCheckModalEl);
    if (modalInstance) modalInstance.hide();
    renderSelectedSkills();
  });

  // Strict Proctor Sensors for in-page modal
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      triggerModalStrictStrike('tab_switch', 'Browser tab switch detected');
    }
  });

  window.addEventListener('blur', () => {
    triggerModalStrictStrike('window_blur', 'Window focus lost (Alt-Tab or desktop click)');
  });

  document.addEventListener('contextmenu', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      e.preventDefault();
      triggerModalStrictStrike('contextmenu', 'Right-click menu attempt blocked');
    }
  }, true);

  document.addEventListener('copy', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      e.preventDefault();
      triggerModalStrictStrike('clipboard', 'Unauthorized copy attempt blocked');
    }
  }, true);

  document.addEventListener('paste', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      e.preventDefault();
      triggerModalStrictStrike('clipboard', 'Unauthorized paste attempt blocked');
    }
  }, true);

  document.addEventListener('cut', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      e.preventDefault();
      triggerModalStrictStrike('clipboard', 'Unauthorized cut attempt blocked');
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (skillCheckModalEl?.classList.contains('show') && modalQuestionState && !modalQuestionState.classList.contains('d-none') && !isModalDisqualified) {
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key;

      if (key === 'F12' || (isCtrl && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key)) || (isCtrl && ['u', 'U'].includes(key))) {
        e.preventDefault();
        e.stopPropagation();
        triggerModalStrictStrike('devtools_attempt', 'Developer inspection shortcut attempt blocked');
        return false;
      }

      if (isCtrl && ['c', 'C', 'v', 'V', 'x', 'X'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerModalStrictStrike('clipboard_shortcut', `Clipboard shortcut Ctrl+${key.toUpperCase()} blocked`);
        return false;
      }
    }
  }, true);

  const startSkillCheck = async (skillName) => {
    const skill = selectedSkillsMap.get(skillName) ||
      Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === (skillName || '').toLowerCase());
    if (!skill) return;

    // Check if skill has active cheating disqualification or cooldown
    const isFlagged = skill.verificationStatus === 'flagged_cheating';
    const isCooldown = Boolean(skill.cooldownActive || (skill.nextRetakeAvailableAt && new Date() < new Date(skill.nextRetakeAvailableAt)));
    if (isFlagged || isCooldown) {
      const hoursRemaining = skill.cooldownRemainingHours || (skill.nextRetakeAvailableAt ? Math.max(1, Math.ceil((new Date(skill.nextRetakeAvailableAt) - new Date()) / (1000 * 60 * 60))) : 24);
      const prefix = isFlagged ? '🚫 Integrity Violation Lockout:' : '⏳ Retake Cooldown Active:';
      showAlert(`${prefix} Skill check for "${skill.displayName || skill.name}" is locked. Retake available in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}.`, 'danger');
      return;
    }

    if (!skillCheckModalEl) return;
    const modal = bootstrap.Modal.getOrCreateInstance(skillCheckModalEl);
    modal.show();

    // Reset modal UI and strict proctoring state
    activeCheckingSkillName = skill.name;
    modalTabSwitchesCount = 0;
    modalStrikes = 0;
    isModalDisqualified = false;
    isModalStrikeActive = false;
    updateModalStrikesHud();
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    const modalContentEl = skillCheckModalEl?.querySelector('.modal-content');
    if (modalContentEl) modalContentEl.style.minHeight = '';
    const modalBodyEl = document.getElementById('modalQuizBody');
    if (modalBodyEl) modalBodyEl.style.minHeight = '';
    if (modalSkillBadge) modalSkillBadge.textContent = skill.displayName || skill.name;
    if (skillCheckModalTitle) skillCheckModalTitle.textContent = 'Reality Check';
    modalLoadingState?.classList.remove('d-none');
    modalQuestionState?.classList.add('d-none');
    modalVerdictState?.classList.add('d-none');
    modalFeedbackBox?.classList.add('d-none');
    if (modalSubmitBtn) {
      modalSubmitBtn.disabled = true;
      modalSubmitBtn.classList.remove('d-none');
    }
    if (modalNextBtn) {
      modalNextBtn.classList.add('d-none');
    }

    try {
      const savedProvider = localStorage.getItem('cp_quiz_preferred_provider') || 'auto';
      const customKey = localStorage.getItem('cp_custom_quiz_key') || null;

      const res = await window.API.post('/quiz/start', {
        skill: skill.name,
        selfRated: skill.selfRatedProficiency || skill.proficiency || 'intermediate',
        displayName: skill.displayName || skill.name,
        provider: savedProvider !== 'auto' ? savedProvider : undefined,
        userApiKey: customKey || undefined
      }, { auth: true });

      if (!res.success || !res.data?.question) {
        throw new Error(res.message || 'Failed to initialize reality check session.');
      }

      activeQuizSession = {
        sessionId: res.data?.sessionId,
        skillName: skill.name,
        displayName: skill.displayName || skill.name,
        selfRated: skill.selfRatedProficiency || skill.proficiency || 'intermediate',
        provider: res.data?.provider,
        isAIGenerated: Boolean(res.data?.isAIGenerated)
      };
      activeQuestionStep = 1;
      activeQuestion = res.data.question;

      // Update provider badge in modal header
      if (modalProviderBadge) {
        modalProviderBadge.classList.remove('d-none');
        if (res.data.isAIGenerated) {
          const prov = res.data.provider || 'AI';
          const pName = prov === 'groq' ? 'Groq AI (Llama)' :
                        prov === 'gemini' ? 'Google Gemini' :
                        prov === 'custom_api_key' ? 'Custom AI Model' : 'Dynamic AI';
          modalProviderBadge.className = 'badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 small';
          modalProviderBadge.innerHTML = `<i class="bi bi-cpu me-1"></i>${escapeHtml(pName)}`;
        } else {
          modalProviderBadge.className = 'badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 small';
          modalProviderBadge.innerHTML = `<i class="bi bi-shield-check me-1"></i>Curated Bank`;
        }
      }

      renderModalQuestion(activeQuestion, 1);
    } catch (err) {
      console.error('Quiz start error:', err);
      const isCooldown = err.cooldownActive || (err.message && err.message.includes('24-hour'));
      if (isCooldown) {
        const hours = err.retryAfterHours || 24;
        showAlert(`\u23F3 24-Hour Review Cooldown: Skill checks can only be retaken after a 24-hour review period to protect credential integrity. Retake available in ${hours} hour${hours > 1 ? 's' : ''}.`, 'warning');
      } else {
        showAlert(`Could not start skill check: ${err.message}`, 'danger');
      }
      modal.hide();
    }
  };

  const renderModalQuestion = (question, stepNumber) => {
    modalLoadingState?.classList.add('d-none');
    modalQuestionState?.classList.remove('d-none');
    modalVerdictState?.classList.add('d-none');
    modalFeedbackBox?.classList.add('d-none');

    activeQuestion = question;
    activeQuestionStep = stepNumber;
    activeSelectedOptionIndex = null;
    startModalQuestionTimer();

    // Difficulty pill
    const diff = (question.difficulty || 'medium').toLowerCase();
    if (modalDifficultyPill) {
      modalDifficultyPill.className = `difficulty-pill ${diff}`;
      modalDifficultyPill.textContent = diff.toUpperCase();
    }

    // Step text & dots
    if (modalStepText) modalStepText.textContent = `Question ${stepNumber} of 5`;
    if (modalStepper) {
      const dots = modalStepper.querySelectorAll('.quiz-step-dot');
      dots.forEach((dot, idx) => {
        dot.className = 'quiz-step-dot';
        if (idx + 1 === stepNumber) dot.classList.add('active');
        else if (idx + 1 < stepNumber) dot.classList.add('completed');
      });
    }

    // Question title & code snippet
    if (modalQuestionPrompt) modalQuestionPrompt.textContent = question.text || question.prompt || '';
    if (modalCodeSnippet) {
      if (question.codeSnippet) {
        modalCodeSnippet.classList.remove('d-none');
        const codeEl = modalCodeSnippet.querySelector('code');
        if (codeEl) codeEl.textContent = question.codeSnippet;
      } else {
        modalCodeSnippet.classList.add('d-none');
      }
    }

    // Options
    if (modalOptionsList) {
      modalOptionsList.innerHTML = '';
      (question.options || []).forEach((opt, idx) => {
        const optCard = document.createElement('div');
        optCard.className = 'quiz-option-card';
        optCard.setAttribute('data-index', idx);
        optCard.innerHTML = `
          <div class="quiz-option-radio">
            <div class="quiz-option-radio-dot"></div>
          </div>
          <div class="quiz-option-text">${escapeHtml(opt)}</div>
        `;

        optCard.addEventListener('click', () => {
          if (optCard.classList.contains('locked')) return;
          modalOptionsList.querySelectorAll('.quiz-option-card').forEach(c => c.classList.remove('selected'));
          optCard.classList.add('selected');
          activeSelectedOptionIndex = idx;
          if (modalSubmitBtn) modalSubmitBtn.disabled = false;
        });

        modalOptionsList.appendChild(optCard);
      });
    }

    if (modalSubmitBtn) {
      modalSubmitBtn.disabled = true;
      modalSubmitBtn.innerHTML = `<span>Submit Answer</span><i class="bi bi-arrow-right ms-1"></i>`;
      modalSubmitBtn.classList.remove('d-none');
    }
    if (modalNextBtn) {
      modalNextBtn.classList.add('d-none');
    }
  };

  modalSubmitBtn?.addEventListener('click', async () => {
    if (activeSelectedOptionIndex === null) return;

    stopModalQuestionTimer();
    const timeTakenSeconds = Math.max(1, Math.round((Date.now() - modalQuestionStartTime) / 1000));

    modalSubmitBtn.disabled = true;
    modalSubmitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status"></span> Checking...`;

    try {
      const res = await window.API.post('/quiz/answer', {
        skill: activeQuizSession?.skillName,
        sessionId: activeQuizSession?.sessionId,
        questionId: activeQuestion?.id,
        selectedIndex: activeSelectedOptionIndex,
        selectedOption: activeSelectedOptionIndex,
        timeTakenSeconds,
        tabSwitches: modalTabSwitchesCount
      }, { auth: true });

      if (!res.success) {
        throw new Error(res.message || 'Failed to submit answer.');
      }

      const data = res.data;
      const correctIdx = Number(data.correctIndex !== undefined ? data.correctIndex : data.correctAnswer);
      const isCorrect = Boolean(data.isCorrect);

      // Lock options and mark colors
      if (modalOptionsList) {
        modalOptionsList.querySelectorAll('.quiz-option-card').forEach((card) => {
          card.classList.add('locked');
          const cIdx = Number(card.getAttribute('data-index'));
          if (cIdx === correctIdx) {
            card.classList.add('option-correct');
          } else if (cIdx === activeSelectedOptionIndex && !isCorrect) {
            card.classList.add('option-wrong');
          }
        });
      }

      // Show feedback box
      if (modalFeedbackBox) {
        modalFeedbackBox.className = `quiz-feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
        if (modalFeedbackIcon) {
          modalFeedbackIcon.className = `quiz-feedback-icon bi ${isCorrect ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`;
        }
        if (modalFeedbackHeadline) {
          modalFeedbackHeadline.textContent = isCorrect ? 'Correct!' : 'Not quite right';
        }
        if (modalFeedbackText) {
          modalFeedbackText.textContent = data.explanation || (isCorrect ? 'Great grasp of this concept!' : 'Review this concept in your study plan.');
        }
        modalFeedbackBox.classList.remove('d-none');
      }

      // Update buttons
      modalSubmitBtn.classList.add('d-none');
      if (modalNextBtn) {
        modalNextBtn.classList.remove('d-none');
        if (data.isFinished) {
          stopModalQuestionTimer();
          activeQuizSummary = data.summary || data.result;
          modalNextBtn.innerHTML = `<span>View Results</span><i class="bi bi-trophy-fill ms-1"></i>`;

          // 1. Immediately calibrate and verify the skill in selectedSkillsMap!
          const skillName = activeQuizSession?.skillName;
          const skill = selectedSkillsMap.get(skillName) ||
            (skillName ? Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === skillName.toLowerCase()) : null);

          const verifiedLevel = (
            activeQuizSummary?.verifiedProficiency ||
            activeQuizSummary?.verifiedLevel ||
            activeQuizSummary?.quizSays ||
            (skill ? (skill.verifiedProficiency || skill.proficiency) : 'intermediate') ||
            'intermediate'
          ).toLowerCase();

          if (skill && activeQuizSummary) {
            skill.selfRatedProficiency = skill.selfRatedProficiency || skill.proficiency || 'intermediate';
            skill.proficiency = verifiedLevel;
            skill.verifiedProficiency = verifiedLevel;
            skill.isQuizVerified = true;
            skill.quizScore = typeof activeQuizSummary.score === 'number' ? activeQuizSummary.score : 0;
            skill.quizGaps = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
            skill.verifiedSource = 'quiz';
            skill.quizSummaryMessage = activeQuizSummary.summaryMessage || activeQuizSummary.realityCheckMessage;
            skill.verificationTier = activeQuizSummary.verificationTier || 'quiz_verified';
            skill.verificationStatus = activeQuizSummary.verificationStatus || 'verified';
            skill.integrityScore = activeQuizSummary.integrityScore ?? 100;
          }

          // 2. Mark account verification complete immediately
          hasCompletedSkillVerification = true;
          const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                              (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
          if (currentUser) {
            currentUser.hasCompletedSkillVerification = true;
            if (activeQuizSummary?.user?.skills) {
              currentUser.skills = activeQuizSummary.user.skills;
            } else if (Array.isArray(currentUser.skills)) {
              let matched = currentUser.skills.find(s => (s.name || '').toLowerCase() === (skillName || '').toLowerCase());
              if (!matched && skillName) {
                matched = { name: skillName, displayName: skill?.displayName || skillName };
                currentUser.skills.push(matched);
              }
              if (matched) {
                matched.selfRatedProficiency = matched.selfRatedProficiency || matched.proficiency || 'intermediate';
                matched.proficiency = verifiedLevel;
                matched.verifiedProficiency = verifiedLevel;
                matched.isQuizVerified = true;
                matched.quizScore = typeof activeQuizSummary.score === 'number' ? activeQuizSummary.score : 0;
                matched.quizGaps = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
                matched.verificationTier = activeQuizSummary.verificationTier || 'quiz_verified';
                matched.verificationStatus = activeQuizSummary.verificationStatus || 'verified';
                matched.integrityScore = activeQuizSummary.integrityScore ?? 100;
              }
            }
            if (typeof window.Auth?.setCurrentUser === 'function') {
              window.Auth.setCurrentUser(currentUser);
            }
          }

          // 3. Immediately render UI so checkmarks and verified badges appear behind modal!
          try {
            renderSkillsGrid();
            updateSelectedSkillsUI();
            renderProveSkillsPanel();
          } catch (renderErr) {
            console.error('Error re-rendering after quiz finished:', renderErr);
          }
        } else {
          activeQuestion = data.nextQuestion;
          modalNextBtn.innerHTML = `<span>Next Question</span><i class="bi bi-arrow-right ms-1"></i>`;
        }
      }
    } catch (err) {
      console.error('Answer submission error:', err);
      showAlert(`Could not submit answer: ${err.message}`, 'danger');
      if (modalSubmitBtn) {
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.innerHTML = `<span>Submit Answer</span><i class="bi bi-arrow-right ms-1"></i>`;
      }
    }
  });

  modalNextBtn?.addEventListener('click', () => {
    if (activeQuizSummary) {
      stopModalQuestionTimer();
      // Show verdict state
      modalQuestionState?.classList.add('d-none');
      modalVerdictState?.classList.remove('d-none');

      const skillName = activeQuizSession?.skillName;
      const skill = selectedSkillsMap.get(skillName) ||
        (skillName ? Array.from(selectedSkillsMap.values()).find(s => (s.name || '').toLowerCase() === skillName.toLowerCase()) : null);

      const verifiedLevel = (
        activeQuizSummary.verifiedProficiency ||
        activeQuizSummary.verifiedLevel ||
        activeQuizSummary.quizSays ||
        (skill ? (skill.verifiedProficiency || skill.proficiency) : 'intermediate') ||
        'intermediate'
      ).toLowerCase();

      if (modalVerdictSelfClaimed) {
        modalVerdictSelfClaimed.textContent = capitalize(activeQuizSummary.selfRated || (skill ? skill.selfRatedProficiency || skill.proficiency : 'Intermediate'));
      }
      if (modalVerdictVerifiedLevel) {
        modalVerdictVerifiedLevel.textContent = capitalize(verifiedLevel);
      }
      if (modalVerdictExplanation) {
        modalVerdictExplanation.textContent = activeQuizSummary.summaryMessage || activeQuizSummary.realityCheckMessage || 'Reality check complete.';
      }

      // Proctor telemetry badge & notice (Pillars 6 & 7)
      const integrity = activeQuizSummary.integrityScore !== undefined ? activeQuizSummary.integrityScore : 100;
      if (modalVerdictIntegrityBadge) {
        modalVerdictIntegrityBadge.textContent = `Integrity: ${integrity}/100`;
        if (integrity < 75) {
          modalVerdictIntegrityBadge.className = 'badge bg-warning text-dark font-mono';
        } else {
          modalVerdictIntegrityBadge.className = 'badge bg-secondary font-mono';
        }
      }

      if (modalVerdictUnconfirmedNotice) {
        if (activeQuizSummary.verificationStatus === 'unconfirmed') {
          modalVerdictUnconfirmedNotice.classList.remove('d-none');
        } else {
          modalVerdictUnconfirmedNotice.classList.add('d-none');
        }
      }

      if (modalVerdictGapsWrap && modalVerdictGaps) {
        const gapsList = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
        if (gapsList.length > 0) {
          modalVerdictGapsWrap.classList.remove('d-none');
          modalVerdictGaps.textContent = gapsList.join(', ');
        } else {
          modalVerdictGapsWrap.classList.add('d-none');
        }
      }

      // Update in selectedSkillsMap
      if (skill) {
        skill.selfRatedProficiency = skill.selfRatedProficiency || skill.proficiency || 'intermediate';
        skill.proficiency = verifiedLevel;
        skill.verifiedProficiency = verifiedLevel;
        skill.isQuizVerified = true;
        skill.quizScore = typeof activeQuizSummary.score === 'number' ? activeQuizSummary.score : 0;
        skill.quizGaps = activeQuizSummary.gaps || activeQuizSummary.identifiedGaps || [];
        skill.verifiedSource = 'quiz';
        skill.quizSummaryMessage = activeQuizSummary.summaryMessage || activeQuizSummary.realityCheckMessage;
      }

      try {
        renderSkillsGrid();
        updateSelectedSkillsUI();
        renderProveSkillsPanel();
      } catch (renderErr) {
        console.error('Error re-rendering in verdict state:', renderErr);
      }
      return;
    }

    if (activeQuestion) {
      renderModalQuestion(activeQuestion, activeQuestionStep + 1);
    }
  });

  modalVerdictRetestBtn?.addEventListener('click', () => {
    const targetSkill = activeQuizSession?.skillName;
    if (targetSkill) {
      startSkillCheck(targetSkill);
    }
  });

  document.getElementById('modalRestartBtn')?.addEventListener('click', () => {
    const targetSkill = activeQuizSession?.skillName;
    if (targetSkill) {
      startSkillCheck(targetSkill);
    }
  });

  document.getElementById('modalCancelBtn')?.addEventListener('click', () => {
    stopModalQuestionTimer();
  });

  modalVerdictDoneBtn?.addEventListener('click', () => {
    stopModalQuestionTimer();
    if (skillCheckModalEl) {
      bootstrap.Modal.getInstance(skillCheckModalEl)?.hide();
    }

    // Reset active quiz variables
    activeQuizSession = null;
    activeQuestion = null;
    activeQuizSummary = null;

    // Mark account verification complete (only required once per account)
    hasCompletedSkillVerification = true;
    const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                        (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
    if (currentUser) {
      currentUser.hasCompletedSkillVerification = true;
      if (typeof window.Auth?.setCurrentUser === 'function') {
        window.Auth.setCurrentUser(currentUser);
      }
    }
    if (typeof window.Auth?.initNav === 'function') {
      window.Auth.initNav();
    }

    // Refresh UI
    try {
      renderSkillsGrid();
      updateSelectedSkillsUI();
      renderProveSkillsPanel();
    } catch (err) {
      console.error('Error refreshing UI on modal done:', err);
    }

    showAlert('\u{1F389} Account Verified \u2713! Your technical skills are verified. Dashboard, Recommendations, and Active Roadmap are now unlocked!', 'success');
  });

  // Ensure modal dismissal (via X button, backdrop click, or ESC) always guarantees immediate UI refresh
  skillCheckModalEl?.addEventListener('hidden.bs.modal', () => {
    stopModalQuestionTimer();
    activeQuizSession = null;
    activeQuestion = null;
    activeQuizSummary = null;
    const modalContentEl = skillCheckModalEl?.querySelector('.modal-content');
    if (modalContentEl) modalContentEl.style.minHeight = '';
    const modalBodyEl = document.getElementById('modalQuizBody');
    if (modalBodyEl) modalBodyEl.style.minHeight = '';
    document.getElementById('modalStrikeOverlay')?.classList.add('d-none');
    try {
      renderSkillsGrid();
      updateSelectedSkillsUI();
      renderProveSkillsPanel();
    } catch (err) {
      console.error('Error refreshing UI on modal hidden:', err);
    }
  });


  // 9. Filters & Search Handlers
  if (skillCategoryFilter) {
    skillCategoryFilter.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        skillCategoryFilter.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategoryFilter = btn.getAttribute('data-cat') || 'all';
        renderSkillsGrid();
      });
    });
  }

  if (skillSearchInput) {
    skillSearchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      renderSkillsGrid();
    });
  }

  if (clearAllSkillsBtn) {
    clearAllSkillsBtn.addEventListener('click', () => {
      selectedSkillsMap.clear();
      updateSelectedSkillsUI();
      renderSkillsGrid();
    });
  }

  // Custom Skill Addition Handler
  const customSkillNameInput = document.getElementById('customSkillName');
  const customSkillCategorySelect = document.getElementById('customSkillCategory');
  const customSkillProficiencySelect = document.getElementById('customSkillProficiency');
  const btnAddCustomSkill = document.getElementById('btnAddCustomSkill');
  const customSkillFeedback = document.getElementById('customSkillFeedback');

  if (btnAddCustomSkill && customSkillNameInput) {
    const handleAddCustomSkill = async () => {
      const rawName = customSkillNameInput.value.trim();
      if (!rawName) {
        if (customSkillFeedback) {
          customSkillFeedback.className = 'small mt-2 text-danger';
          customSkillFeedback.textContent = 'Please enter a skill name (e.g. Rust, Solidity, Blender).';
          customSkillFeedback.classList.remove('d-none');
        }
        return;
      }
      if (rawName.includes('@') || rawName.includes('.com') || rawName.includes('http')) {
        if (customSkillFeedback) {
          customSkillFeedback.className = 'small mt-2 text-danger';
          customSkillFeedback.textContent = 'Please enter a valid skill or technology name (e.g. Docker, Rust, Flutter).';
          customSkillFeedback.classList.remove('d-none');
        }
        return;
      }

      if (selectedSkillsMap.size >= 20) {
        showAlert('You can select a maximum of 20 skills for assessment.', 'warning');
        return;
      }

      const cleanSlug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const category = customSkillCategorySelect?.value || 'tool';
      const proficiency = customSkillProficiencySelect?.value || 'intermediate';

      // Explicitly register custom skill in active stream
      const assignedStreams = selectedStream === 'cross' ? ['engineering', 'business', 'marketing', 'creative', 'cross'] : [selectedStream];
      SKILL_STREAM_MAP[cleanSlug] = assignedStreams;

      // Ensure skill is registered in available list
      let existing = allAvailableSkills.find((s) => s.name === cleanSlug);
      if (!existing) {
        existing = {
          name: cleanSlug,
          displayName: rawName,
          category: category,
          stream: selectedStream,
          isCustom: true,
        };
        allAvailableSkills.unshift(existing);
      } else {
        existing.stream = selectedStream;
      }

      // Add to selected map
      selectedSkillsMap.set(cleanSlug, {
        name: cleanSlug,
        displayName: rawName,
        category: category,
        proficiency: proficiency,
        selfRatedProficiency: proficiency,
        isCustom: true
      });

      // Register with backend catalog in background
      try {
        window.API.post('/skills/custom', {
          name: cleanSlug,
          displayName: rawName,
          category: category,
        }, { auth: true }).catch(() => {});
      } catch (_) {}

      // Reset input & provide quick visual confirmation
      customSkillNameInput.value = '';
      if (customSkillFeedback) {
        customSkillFeedback.className = 'small mt-2 text-teal';
        customSkillFeedback.textContent = `✓ "${rawName}" added to your skills!`;
        customSkillFeedback.classList.remove('d-none');
        setTimeout(() => {
          customSkillFeedback.classList.add('d-none');
        }, 3500);
      }

      renderSkillsGrid();
      updateSelectedSkillsUI();
    };

    btnAddCustomSkill.addEventListener('click', handleAddCustomSkill);
    customSkillNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustomSkill();
      }
    });
  }

  // Hackathon Judge Demo Profile Auto-Fill Handler (Adaptive to Stream)
  const btnJudgeDemoFill = document.getElementById('btnJudgeDemoFill');
  if (btnJudgeDemoFill) {
    btnJudgeDemoFill.addEventListener('click', () => {
      const nameInput = document.getElementById('fullName');
      const courseInput = document.getElementById('course');
      const branchInput = document.getElementById('branch');
      const yearInput = document.getElementById('year');
      const collegeInput = document.getElementById('college');
      const careerGoalsInput = document.getElementById('careerGoals');

      // Clear existing interests & skills before filling stream-specific demo profile
      selectedInterests.clear();
      selectedSkillsMap.clear();

      if (selectedStream === 'business') {
        if (nameInput) nameInput.value = 'Aarav Sharma';
        if (courseInput) courseInput.value = 'BBA Finance & Analytics';
        if (branchInput) branchInput.value = 'Corporate Finance & M&A';
        if (yearInput) yearInput.value = 'Third Year';
        if (collegeInput) collegeInput.value = 'Indian Institute of Management';
        if (careerGoalsInput) careerGoalsInput.value = 'Lead Financial Analyst & Strategic M&A Consultant';

        ['financial modeling', 'finance', 'valuation', 'business operations'].forEach(i => selectedInterests.add(i));

        const demoSkills = [
          { name: 'financial-modeling', displayName: 'Financial Modeling & Valuation', proficiency: 'advanced', category: 'finance' },
          { name: 'dcf-valuation', displayName: 'DCF Valuation & Financial Statements', proficiency: 'intermediate', category: 'finance' },
          { name: 'accounting', displayName: 'Financial Accounting & Reporting', proficiency: 'intermediate', category: 'finance' },
          { name: 'excel', displayName: 'Excel', proficiency: 'advanced', category: 'data' },
          { name: 'power-bi', displayName: 'Power BI', proficiency: 'intermediate', category: 'data' },
          { name: 'communication', displayName: 'Communication', proficiency: 'advanced', category: 'soft-skill' },
        ];
        demoSkills.forEach(s => selectedSkillsMap.set(s.name, s));
      } else if (selectedStream === 'marketing') {
        if (nameInput) nameInput.value = 'Priya Sen';
        if (courseInput) courseInput.value = 'B.Com Marketing & Digital Media';
        if (branchInput) branchInput.value = 'Performance Marketing';
        if (yearInput) yearInput.value = 'Third Year';
        if (collegeInput) collegeInput.value = 'St. Xavier College of Commerce';
        if (careerGoalsInput) careerGoalsInput.value = 'Head of Growth Marketing & Paid Acquisition';

        ['digital marketing', 'advertising', 'seo', 'social media'].forEach(i => selectedInterests.add(i));

        const demoSkills = [
          { name: 'meta-ads', displayName: 'Meta Ads Manager & Paid Social', proficiency: 'advanced', category: 'marketing' },
          { name: 'google-ads', displayName: 'Google Ads & SEM', proficiency: 'intermediate', category: 'marketing' },
          { name: 'seo', displayName: 'SEO & Organic Search Strategy', proficiency: 'advanced', category: 'marketing' },
          { name: 'content-marketing', displayName: 'Content Marketing & Copywriting', proficiency: 'intermediate', category: 'marketing' },
          { name: 'google-analytics', displayName: 'Google Analytics 4 & Attribution', proficiency: 'intermediate', category: 'marketing' },
          { name: 'excel', displayName: 'Excel', proficiency: 'intermediate', category: 'data' },
        ];
        demoSkills.forEach(s => selectedSkillsMap.set(s.name, s));
      } else if (selectedStream === 'creative') {
        if (nameInput) nameInput.value = 'Ananya Roy';
        if (courseInput) courseInput.value = 'B.Des Interaction & Visual Design';
        if (branchInput) branchInput.value = 'Visual Communication';
        if (yearInput) yearInput.value = 'Third Year';
        if (collegeInput) collegeInput.value = 'National Institute of Design (NID)';
        if (careerGoalsInput) careerGoalsInput.value = 'Lead Product & Brand Identity Visual Designer';

        ['design', 'branding', 'motion graphics', 'visual storytelling'].forEach(i => selectedInterests.add(i));

        const demoSkills = [
          { name: 'brand-identity', displayName: 'Brand Identity & Logo Systems', proficiency: 'advanced', category: 'design' },
          { name: 'adobe-illustrator', displayName: 'Adobe Illustrator', proficiency: 'advanced', category: 'design' },
          { name: 'figma', displayName: 'Figma', proficiency: 'advanced', category: 'design' },
          { name: 'visual-design', displayName: 'Visual Design', proficiency: 'advanced', category: 'design' },
          { name: 'motion-graphics', displayName: 'Motion Graphics & After Effects', proficiency: 'intermediate', category: 'design' },
          { name: 'typography', displayName: 'Typography & Layout Design', proficiency: 'intermediate', category: 'design' },
        ];
        demoSkills.forEach(s => selectedSkillsMap.set(s.name, s));
      } else {
        // Engineering / Cross track
        if (nameInput) nameInput.value = 'Parth Patil';
        if (courseInput) courseInput.value = 'B.Tech Computer Science';
        if (branchInput) branchInput.value = 'Information Technology';
        if (yearInput) yearInput.value = 'Third Year';
        if (collegeInput) collegeInput.value = 'Pune Institute of Technology';
        if (careerGoalsInput) careerGoalsInput.value = 'Full-Stack Web & AI Application Developer';

        ['web development', 'artificial intelligence', 'problem solving', 'cloud computing'].forEach((i) => {
          selectedInterests.add(i);
        });

        const demoSkills = [
          { name: 'html', displayName: 'HTML', proficiency: 'intermediate', category: 'frontend', isDefaultVerified: true, defaultScore: 5 },
          { name: 'css', displayName: 'CSS', proficiency: 'intermediate', category: 'frontend', isDefaultVerified: false },
          { name: 'javascript', displayName: 'JavaScript', proficiency: 'advanced', category: 'frontend', isDefaultVerified: true, defaultScore: 5 },
          { name: 'react', displayName: 'React', proficiency: 'intermediate', category: 'frontend', isDefaultVerified: false },
          { name: 'node.js', displayName: 'Node.js', proficiency: 'intermediate', category: 'backend', isDefaultVerified: true, defaultScore: 4 },
          { name: 'python', displayName: 'Python', proficiency: 'intermediate', category: 'backend', isDefaultVerified: false },
        ];

        demoSkills.forEach((s) => {
          selectedSkillsMap.set(s.name, {
            name: s.name,
            displayName: s.displayName,
            category: s.category,
            proficiency: s.proficiency,
            selfRatedProficiency: s.proficiency,
            verifiedProficiency: s.isDefaultVerified ? s.proficiency : null,
            isQuizVerified: s.isDefaultVerified,
            isCodeVerified: false,
            quizScore: s.isDefaultVerified ? s.defaultScore : 0,
            quizGaps: [],
            verifiedSource: s.isDefaultVerified ? 'quiz' : 'self'
          });
        });
      }

      hasCompletedSkillVerification = true;
      const currentUser = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) ||
                          (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null);
      if (currentUser) {
        currentUser.hasCompletedSkillVerification = true;
        if (typeof window.Auth?.setCurrentUser === 'function') {
          window.Auth.setCurrentUser(currentUser);
        }
      }

      renderInterests();
      renderSkillsGrid();
      updateSelectedSkillsUI();

      showAlert(`✓ Demo profile loaded for ${STREAM_META[selectedStream]?.label || 'selected stream'}!`, 'success');

      // Scroll smoothly to step 1 form
      const formEl = document.getElementById('assessmentForm');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Auto-Detect Skills from GitHub Repos Handler
  const btnAutoDetectGitHubSkills = document.getElementById('btnAutoDetectGitHubSkills');
  const btnAutoDetectGitHubText = document.getElementById('btnAutoDetectGitHubText');
  const btnChangeGitHubAccount = document.getElementById('btnChangeGitHubAccount');

  const updateGitHubButtonState = () => {
    const user = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) || 
                 (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null) || 
                 null;
    const connectedGhUser = user?.githubProfile?.username;

    if (connectedGhUser) {
      if (btnAutoDetectGitHubText) {
        btnAutoDetectGitHubText.textContent = `Auto-Detect from @${connectedGhUser}`;
      }
      if (btnChangeGitHubAccount) {
        btnChangeGitHubAccount.classList.remove('d-none');
        btnChangeGitHubAccount.classList.add('d-inline-flex');
      }
    } else {
      if (btnAutoDetectGitHubText) {
        btnAutoDetectGitHubText.textContent = 'Auto-Detect from GitHub Repos';
      }
      if (btnChangeGitHubAccount) {
        btnChangeGitHubAccount.classList.add('d-none');
        btnChangeGitHubAccount.classList.remove('d-inline-flex');
      }
    }
  };

  // Wizard state preservation for seamless OAuth
  const saveAssessmentDraft = () => {
    try {
      const draft = {
        step: currentStep,
        fullName: document.getElementById('fullName')?.value || '',
        course: document.getElementById('course')?.value || '',
        branch: document.getElementById('branch')?.value || '',
        year: document.getElementById('year')?.value || '',
        college: document.getElementById('college')?.value || '',
        careerGoals: document.getElementById('careerGoals')?.value || '',
        selectedInterests: Array.from(selectedInterests),
        selectedSkills: Array.from(selectedSkillsMap.values()),
        hasCompletedSkillVerification: Boolean(hasCompletedSkillVerification),
        timestamp: Date.now(),
      };
      sessionStorage.setItem('cp_assessment_draft', JSON.stringify(draft));
    } catch (e) {}
  };
  window.saveAssessmentDraft = saveAssessmentDraft;

  const applyDetectedSkills = (data) => {
    const verifiedSkills = data?.detectedSkills || data?.verifiedSkills || (data?.user?.skills || []).filter(s => s.isCodeVerified) || [];
    let countAdded = 0;

    verifiedSkills.forEach(s => {
      const key = (s.name || '').toLowerCase();
      if (!key) return;
      if (!allAvailableSkills.some(item => item.name.toLowerCase() === key)) {
        allAvailableSkills.unshift({
          name: key,
          displayName: s.displayName || s.name,
          category: s.category || 'backend'
        });
      }
      selectedSkillsMap.set(key, {
        name: key,
        displayName: s.displayName || s.name,
        category: s.category || 'backend',
        proficiency: s.proficiency || 'intermediate',
        isCodeVerified: true,
        verifiedSource: s.verifiedSource || 'github_repo'
      });
      countAdded++;
    });

    if (countAdded > 0) {
      hasCompletedSkillVerification = true;
    }

    renderSkillsGrid();
    updateSelectedSkillsUI();
    updateGitHubButtonState();

    const ghUser = data?.profile?.username || data?.user?.githubProfile?.username || data?.profile?.login || 'user';
    const repoCount = data?.repositories?.length || data?.repos?.length || data?.user?.githubRepos?.length || 0;
    showAlert(`\u2713 Scanned @${ghUser} (${repoCount} study repos) and auto-detected ${countAdded} verified skills!`, 'success');
    if (btnAutoDetectGitHubSkills) {
      btnAutoDetectGitHubSkills.disabled = false;
      btnAutoDetectGitHubSkills.innerHTML = `<i class="bi bi-patch-check-fill text-success"></i> <span>@${ghUser} (${countAdded} Verified)</span>`;
    }
  };
  window.applyDetectedSkills = applyDetectedSkills;

  updateGitHubButtonState();

  if (btnAutoDetectGitHubSkills) {
    btnAutoDetectGitHubSkills.addEventListener('click', () => {
      const user = (typeof window.Auth?.getUser === 'function' ? window.Auth.getUser() : null) || 
                   (typeof window.Auth?.getCurrentUser === 'function' ? window.Auth.getCurrentUser() : null) || 
                   null;
      const connectedGhUser = user?.githubProfile?.username || '';

      if (window.GitHubAuth?.showUniversalGitHubModal) {
        window.GitHubAuth.showUniversalGitHubModal({
          onSuccess: (data) => {
            applyDetectedSkills(data);
          }
        }, true, 'Enter your personal GitHub username to scan your public repositories and auto-verify skills with code evidence:');

        // Pre-fill input if there was an account previously connected
        if (connectedGhUser) {
          setTimeout(() => {
            const input = document.getElementById('ghUsernameInput');
            if (input && !input.value) {
              input.value = connectedGhUser;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }, 150);
        }
      } else {
        showAlert('GitHub integration script loading. Please refresh.', 'warning');
      }
    });
  }

  // Switch / Change GitHub Account Button
  if (btnChangeGitHubAccount) {
    btnChangeGitHubAccount.addEventListener('click', () => {
      if (window.GitHubAuth?.showUniversalGitHubModal) {
        window.GitHubAuth.showUniversalGitHubModal({
          onSuccess: (data) => {
            applyDetectedSkills(data);
          }
        }, true, 'Enter any student GitHub username to scan repositories and auto-verify skills.');
      }
    });
  }

  // Load Remote Skills from Catalog
  const loadRemoteSkills = async () => {
    try {
      const res = await window.API.get('/skills');
      if (res.success && Array.isArray(res.data?.skills) && res.data.skills.length > 0) {
        const map = new Map();
        FALLBACK_SKILLS.forEach((s) => map.set(s.name, s));
        res.data.skills.forEach((s) => {
          const existing = map.get(s.name);
          map.set(s.name, {
            name: s.name,
            displayName: s.displayName,
            category: s.category,
            stream: existing?.stream || (SKILL_STREAM_MAP[s.name] && SKILL_STREAM_MAP[s.name].length === 1 ? SKILL_STREAM_MAP[s.name][0] : undefined),
          });
        });
        allAvailableSkills = Array.from(map.values());
      }
    } catch (err) {
      console.warn('Using local fallback skills catalog:', err.message);
    }
  };

  // 10. Preload Profile Data
  const preloadProfile = async () => {
    await loadRemoteSkills();
    try {
      const response = await window.API.get('/users/me', { auth: true });
      if (response.success && response.data?.user) {
        const user = response.data.user;

        if (user.name) document.getElementById('fullName').value = user.name;
        if (user.education) {
          if (user.education.course) document.getElementById('course').value = user.education.course;
          if (user.education.branch) document.getElementById('branch').value = user.education.branch;
          if (user.education.year) document.getElementById('year').value = user.education.year;
          if (user.education.college) document.getElementById('college').value = user.education.college;
        }

        if (Array.isArray(user.interests)) {
          user.interests.forEach((i) => selectedInterests.add(String(i).toLowerCase()));
        }

        if (Array.isArray(user.skills)) {
          user.skills.forEach((s) => {
            const key = s.name.toLowerCase();
            if (!allAvailableSkills.some(item => item.name.toLowerCase() === key)) {
              allAvailableSkills.unshift({
                name: key,
                displayName: s.displayName || s.name,
                category: s.category || 'tool'
              });
            }
            selectedSkillsMap.set(key, {
              name: key,
              displayName: s.displayName || s.name,
              category: s.category || 'tool',
              proficiency: s.verifiedProficiency || s.proficiency || 'beginner',
              isCodeVerified: !!s.isCodeVerified,
              verifiedSource: s.verifiedSource || 'self',
              isQuizVerified: !!s.isQuizVerified,
              selfRatedProficiency: s.selfRatedProficiency || null,
              verifiedProficiency: s.verifiedProficiency || null,
              quizScore: typeof s.quizScore === 'number' ? s.quizScore : 0,
              quizGaps: Array.isArray(s.quizGaps) ? s.quizGaps : [],
              quizVerifiedAt: s.quizVerifiedAt || null,
            });
          });
        }

        if (user.primaryStream && validStreams.includes(user.primaryStream)) {
          selectedStream = user.primaryStream;
        }

        if (Array.isArray(user.careerGoals) && user.careerGoals.length > 0) {
          document.getElementById('careerGoals').value = user.careerGoals[0] || '';
        }

        if (user.hasCompletedSkillVerification || (Array.isArray(user.skills) && user.skills.some((s) => s.isQuizVerified))) {
          hasCompletedSkillVerification = true;
        }

        if (typeof window.Auth?.setCurrentUser === 'function') {
          window.Auth.setCurrentUser(user);
        }
      }
    } catch (err) {
      console.warn('Could not preload existing profile:', err.message);
    }

    // Restore draft state if returning from OAuth redirect or page reload
    let targetStep = 0;
    try {
      const draftRaw = sessionStorage.getItem('cp_assessment_draft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft.step !== undefined && draft.step >= 0 && draft.step <= 4) {
          targetStep = draft.step;
        }
        if (draft.primaryStream && validStreams.includes(draft.primaryStream)) {
          selectedStream = draft.primaryStream;
        }
        if (draft.fullName && !document.getElementById('fullName').value) document.getElementById('fullName').value = draft.fullName;
        if (draft.course && !document.getElementById('course').value) document.getElementById('course').value = draft.course;
        if (draft.branch && !document.getElementById('branch').value) document.getElementById('branch').value = draft.branch;
        if (draft.year && !document.getElementById('year').value) document.getElementById('year').value = draft.year;
        if (draft.college && !document.getElementById('college').value) document.getElementById('college').value = draft.college;
        if (draft.careerGoals && !document.getElementById('careerGoals').value) document.getElementById('careerGoals').value = draft.careerGoals;
        if (Array.isArray(draft.selectedInterests)) {
          draft.selectedInterests.forEach((i) => selectedInterests.add(String(i).toLowerCase()));
        }
        if (Array.isArray(draft.selectedSkills)) {
          draft.selectedSkills.forEach((s) => {
            const key = (s.name || '').toLowerCase();
            if (key) selectedSkillsMap.set(key, s);
          });
        }
        if (draft.hasCompletedSkillVerification) {
          hasCompletedSkillVerification = true;
        }
        sessionStorage.removeItem('cp_assessment_draft');
      }
    } catch (err) {}

    if (streamParam && validStreams.includes(streamParam)) {
      selectedStream = streamParam;
    }

    applyStreamUI(selectedStream);
    updateSelectedSkillsUI();
    updateStepUI(targetStep);
  };

  // 11. Form Submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertContainer) alertContainer.innerHTML = '';

    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    const resetSubmitBtn = () => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    };

    const fullName = document.getElementById('fullName').value.trim();
    const course = document.getElementById('course').value.trim();
    const branch = document.getElementById('branch').value.trim();
    const year = document.getElementById('year').value;
    const college = document.getElementById('college').value.trim();
    const goalText = document.getElementById('careerGoals').value.trim();

    if (!selectedStream) {
      updateStepUI(0);
      showAlert('Please select your primary stream.');
      return;
    }

    if (!fullName) {
      updateStepUI(1);
      showAlert('Full Name is required.');
      return;
    }

    if (!course) {
      updateStepUI(1);
      showAlert('Degree or Course is required.');
      return;
    }

    if (selectedInterests.size === 0) {
      updateStepUI(2);
      showAlert('Please select at least 1 domain of interest.');
      return;
    }

    if (selectedSkillsMap.size === 0) {
      updateStepUI(3);
      showAlert('Please select at least 1 skill you possess.');
      return;
    }

    const payload = {
      name: fullName,
      primaryStream: selectedStream,
      education: {
        course,
        branch,
        year,
        college,
      },
      interests: Array.from(selectedInterests),
      skills: Array.from(selectedSkillsMap.values()),
      careerGoals: goalText ? [goalText] : [],
      hasCompletedSkillVerification: Boolean(hasCompletedSkillVerification),
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="rg-shine"><span></span></span>
        <span class="rg-bg"></span>
        <span class="rg-label">
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          <span>Calculating Career Matches...</span>
        </span>
      `;
    }

    try {
      const response = await window.API.put('/assessment', payload, { auth: true });

      if (response.success) {
        if (response.data?.user) {
          window.Auth.setCurrentUser(response.data.user);
        }

        showAlert('\u2713 Profile & verified skills saved! Directing you to your career recommendations...', 'success');
        resetSubmitBtn();
        setTimeout(() => {
          window.location.href = 'recommendations.html';
        }, 600);
      } else {
        showAlert(response.message || 'Failed to submit assessment.');
        resetSubmitBtn();
      }
    } catch (err) {
      resetSubmitBtn();

      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const errorMsg = err.errors.map((e) => e.message).join('; ');
        showAlert(errorMsg);
      } else {
        showAlert(err.message || 'Error saving assessment. Please try again.');
      }
    }
  });

  // Initial load
  preloadProfile();
});
