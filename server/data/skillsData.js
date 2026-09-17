/**
 * data/skillsData.js — 35+ Standardized Industry Skills
 *
 * Seed data for the Skill collection.
 * Categories match SkillCategoryEnum in models/Skill.js.
 */

const skillsData = [
  // ── Frontend (6) ──────────────────────────────────────────
  {
    name: 'html',
    displayName: 'HTML',
    category: 'frontend',
    description: 'Hypertext Markup Language for creating the semantic structure of modern web pages.',
  },
  {
    name: 'css',
    displayName: 'CSS',
    category: 'frontend',
    description: 'Cascading Style Sheets for layout, styling, colors, and responsive visual design.',
  },
  {
    name: 'javascript',
    displayName: 'JavaScript',
    category: 'frontend',
    description: 'Core scripting language for interactive web experiences, DOM manipulation, and dynamic logic.',
  },
  {
    name: 'responsive-design',
    displayName: 'Responsive Design',
    category: 'frontend',
    description: 'Techniques including flexbox, grid, and media queries to ensure websites look great across mobile and desktop.',
  },
  {
    name: 'react',
    displayName: 'React',
    category: 'frontend',
    description: 'Popular component-based JavaScript library for building scalable Single Page Applications and reactive UIs.',
  },
  {
    name: 'bootstrap',
    displayName: 'Bootstrap',
    category: 'frontend',
    description: 'Component-rich CSS framework for fast, responsive web design with pre-styled grid and interactive utilities.',
  },

  // ── Backend (5) ───────────────────────────────────────────
  {
    name: 'node.js',
    displayName: 'Node.js',
    category: 'backend',
    description: 'V8-powered asynchronous JavaScript runtime for high-throughput backend services and servers.',
  },
  {
    name: 'express.js',
    displayName: 'Express.js',
    category: 'backend',
    description: 'Minimalist, flexible Node.js web application framework for structuring RESTful APIs and middleware.',
  },
  {
    name: 'rest-apis',
    displayName: 'REST APIs',
    category: 'backend',
    description: 'Design and implementation of standard HTTP endpoints, status codes, JSON payloads, and stateless architecture.',
  },
  {
    name: 'authentication',
    displayName: 'Authentication',
    category: 'backend',
    description: 'Secure user identity management, password hashing with bcrypt, and token-based auth with JSON Web Tokens (JWT).',
  },
  {
    name: 'python',
    displayName: 'Python',
    category: 'backend',
    description: 'Versatile, high-level programming language used extensively in backend development, data analysis, and automation.',
  },

  // ── Database (4) ──────────────────────────────────────────
  {
    name: 'mongodb',
    displayName: 'MongoDB',
    category: 'database',
    description: 'Leading document-oriented NoSQL database for flexible JSON-like documents and scalable data storage.',
  },
  {
    name: 'sql',
    displayName: 'SQL',
    category: 'database',
    description: 'Structured Query Language for creating, reading, updating, and querying relational database management systems.',
  },
  {
    name: 'mysql',
    displayName: 'MySQL',
    category: 'database',
    description: 'Reliable open-source relational database system widely used for structured tables, indexing, and transactions.',
  },
  {
    name: 'database-design',
    displayName: 'Database Design',
    category: 'database',
    description: 'Architecting efficient data schemas, relationships, normalization, indexing, and data integrity guarantees.',
  },

  // ── Data (5) ──────────────────────────────────────────────
  {
    name: 'excel',
    displayName: 'Excel',
    category: 'data',
    description: 'Spreadsheet tool for data organization, formulas, pivot tables, and baseline business intelligence.',
  },
  {
    name: 'statistics',
    displayName: 'Statistics',
    category: 'data',
    description: 'Mathematical foundation of data analysis: distributions, probability, hypothesis testing, and statistical significance.',
  },
  {
    name: 'power-bi',
    displayName: 'Power BI',
    category: 'data',
    description: 'Microsoft business analytics platform for interactive dashboards, reports, and organizational KPIs.',
  },
  {
    name: 'data-visualization',
    displayName: 'Data Visualization',
    category: 'data',
    description: 'Communicating insights visually using charts, scatter plots, trend lines, and clear visual narratives.',
  },
  {
    name: 'data-cleaning',
    displayName: 'Data Cleaning',
    category: 'data',
    description: 'Identifying and correcting inaccurate, missing, or malformed records from raw datasets to prepare for analysis.',
  },

  // ── Design (5) ────────────────────────────────────────────
  {
    name: 'figma',
    displayName: 'Figma',
    category: 'design',
    description: 'Industry-standard collaborative interface design tool for wireframing, UI prototyping, and design systems.',
  },
  {
    name: 'wireframing',
    displayName: 'Wireframing',
    category: 'design',
    description: 'Low-fidelity structural blueprints of digital products defining page layout, content flow, and hierarchy.',
  },
  {
    name: 'prototyping',
    displayName: 'Prototyping',
    category: 'design',
    description: 'Building interactive and clickable mockups to simulate end-user workflows and validate usability.',
  },
  {
    name: 'user-research',
    displayName: 'User Research',
    category: 'design',
    description: 'Methods for discovering user behaviors, friction points, and motivations through interviews and usability tests.',
  },
  {
    name: 'visual-design',
    displayName: 'Visual Design',
    category: 'design',
    description: 'Principles of typography, color theory, spacing, accessibility contrast, and modern aesthetic elegance.',
  },

  // ── Security (5) ──────────────────────────────────────────
  {
    name: 'networking',
    displayName: 'Networking',
    category: 'security',
    description: 'Fundamentals of TCP/IP, DNS, routing, subnets, firewalls, and network packet flow.',
  },
  {
    name: 'linux',
    displayName: 'Linux',
    category: 'security',
    description: 'Command line operations, file permissions, shell scripting, and server administration on Linux environments.',
  },
  {
    name: 'cybersecurity-fundamentals',
    displayName: 'Cybersecurity Fundamentals',
    category: 'security',
    description: 'Core security tenets: confidentiality, integrity, availability, threat vectors, and defensive measures.',
  },
  {
    name: 'ethical-hacking',
    displayName: 'Ethical Hacking',
    category: 'security',
    description: 'Authorized penetration testing techniques to discover and remediate security vulnerabilities before adversaries do.',
  },
  {
    name: 'owasp-basics',
    displayName: 'OWASP Basics',
    category: 'security',
    description: 'Understanding and mitigating the Top 10 Web Application Security Risks including injection and XSS.',
  },

  // ── Tools & Soft Skills (5) ───────────────────────────────
  {
    name: 'git',
    displayName: 'Git',
    category: 'tool',
    description: 'Distributed version control system for tracking code changes, branching, merging, and collaboration.',
  },
  {
    name: 'github',
    displayName: 'GitHub',
    category: 'tool',
    description: 'Cloud hosting platform for Git repositories with pull requests, issue tracking, and CI/CD workflows.',
  },
  {
    name: 'problem-solving',
    displayName: 'Problem Solving',
    category: 'soft-skill',
    description: 'Analytical mindset to deconstruct complex technical roadblocks into structured, testable algorithmic solutions.',
  },
  {
    name: 'communication',
    displayName: 'Communication',
    category: 'soft-skill',
    description: 'Clear, concise verbal and written conveyance of technical ideas, documentation, and cross-functional updates.',
  },
  {
    name: 'teamwork',
    displayName: 'Teamwork',
    category: 'soft-skill',
    description: 'Collaborating effectively in agile teams, pair programming, active listening, and constructive peer reviews.',
  },

  // ── Modern & Trending Industry Skills (12) ────────────────
  {
    name: 'typescript',
    displayName: 'TypeScript',
    category: 'frontend',
    description: 'Typed superset of JavaScript for scalable, maintainable, and type-safe enterprise web applications.',
  },
  {
    name: 'next.js',
    displayName: 'Next.js',
    category: 'frontend',
    description: 'Production-grade React framework featuring server-side rendering, static site generation, and full-stack API routes.',
  },
  {
    name: 'tailwind-css',
    displayName: 'Tailwind CSS',
    category: 'frontend',
    description: 'Utility-first CSS framework for rapid, highly customized modern responsive user interface construction.',
  },
  {
    name: 'flutter',
    displayName: 'Flutter',
    category: 'frontend',
    description: 'Google multi-platform UI framework for building natively compiled mobile (iOS, Android), web, and desktop applications.',
  },
  {
    name: 'fastapi',
    displayName: 'FastAPI',
    category: 'backend',
    description: 'Modern, blazing-fast Python web framework for building REST & OpenAPI backends with automatic type validation.',
  },
  {
    name: 'graphql',
    displayName: 'GraphQL',
    category: 'backend',
    description: 'Declarative query language and runtime for APIs that empowers clients to request exactly what they need.',
  },
  {
    name: 'docker',
    displayName: 'Docker',
    category: 'cloud',
    description: 'Containerization engine for isolating and deploying lightweight, portable applications reproducibly across any cloud.',
  },
  {
    name: 'kubernetes',
    displayName: 'Kubernetes',
    category: 'cloud',
    description: 'Automated container orchestration platform for scaling, load balancing, and managing high-availability microservices.',
  },
  {
    name: 'aws',
    displayName: 'AWS Cloud',
    category: 'cloud',
    description: 'Amazon Web Services cloud architecture covering EC2, S3, Lambda serverless, IAM security, and cloud networking.',
  },
  {
    name: 'langchain',
    displayName: 'LangChain',
    category: 'data',
    description: 'Open-source framework for building contextual AI agents, RAG pipelines, and chaining Large Language Models.',
  },
  {
    name: 'generative-ai',
    displayName: 'Generative AI & LLMs',
    category: 'data',
    description: 'Prompt engineering, LLM integration, fine-tuning, vector embeddings, and building production-ready generative systems.',
  },
  {
    name: 'pytorch',
    displayName: 'PyTorch',
    category: 'data',
    description: 'Leading deep learning framework for training and deploying computer vision, NLP, and neural network architectures.',
  },
];

module.exports = skillsData;
