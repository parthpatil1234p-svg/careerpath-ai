/**
 * services/aiQuizGeneratorService.js — Multi-Model AI Dynamic Quiz Generator
 * 
 * Supports generating dynamic, adaptive technical questions for ANY skill using:
 * - Groq Cloud API (Ultra-fast Qwen / Llama models < 400ms)
 * - Google Gemini API (gemini-2.0-flash / gemini-1.5-flash)
 * - OpenAI-compatible endpoints / Custom User-provided API keys
 * - Built-in Domain Engine Fallback (guaranteed 100% uptime with zero failure)
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026-27
 */

const questionCache = new Map(); // key: skill.toLowerCase(), value: { questions, timestamp }
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Clean and parse JSON from LLM responses that may wrap in markdown codeblocks
 */
function cleanAndParseJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (_) {}
    }
    return null;
  }
}

/**
 * Generate 5 adaptive questions using Groq Cloud API
 */
async function generateWithGroq(skill, customApiKey = null) {
  const apiKey = customApiKey || process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const models = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
  ].filter(Boolean);

  const systemPrompt = `You are a principal engineer and technical interview examiner.
Your job is to generate a 5-question adaptive reality-check quiz for the skill: "${skill}".

Format requirements:
- Respond in strictly valid JSON format only (NO markdown code blocks, NO intro, NO commentary).
- Return an object with a "questions" array containing EXACTLY 5 questions:
  1. Difficulty "medium": Core practical usage / common feature.
  2. Difficulty "easy": Syntax / fundamentals / core definition.
  3. Difficulty "medium": Real-world pattern / debugging / gotcha.
  4. Difficulty "hard": Performance optimization / concurrency / internal architecture.
  5. Difficulty "hard": Edge case / production failure scenario / deep mastery.

Each item in "questions" must have:
- "id": string (e.g. "${skill.toLowerCase().replace(/[^a-z0-9]/g, '')}-1", etc.)
- "difficulty": "easy" | "medium" | "hard"
- "topic": string (concise 2-4 word topic, e.g. "Container Networking", "Memory Layout", "Index Scan")
- "question": string (clear, practical, concise question)
- "codeSnippet": string or null (realistic 2-6 lines of code if relevant, or null)
- "options": array of EXACTLY 4 distinct, plausible string answers
- "correctIndex": integer 0, 1, 2, or 3 (indicating which option is correct)
- "explanation": string (punchy 1-2 sentence explanation of why the correct option is right and the key pitfall to avoid)`;

  const userPrompt = `Generate the 5 adaptive technical quiz questions for: ${skill}. Output pure JSON.`;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 1800
        })
      });

      clearTimeout(timeout);
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`[AIQuiz] Groq ${model} status ${response.status}:`, errJson.error?.message || response.statusText);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = cleanAndParseJSON(content);

      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length >= 3) {
        return sanitizeQuestions(parsed.questions, skill, `Groq (${model})`);
      }
    } catch (err) {
      console.warn(`[AIQuiz] Groq ${model} exception:`, err.message);
    }
  }

  throw new Error('Groq models failed to generate valid quiz questions');
}

/**
 * Generate 5 adaptive questions using Google Gemini API
 */
async function generateWithGemini(skill, customApiKey = null) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const models = [
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ].filter(Boolean);

  const promptText = `You are a technical interview examiner. Generate 5 adaptive quiz questions for the skill: "${skill}".
Output strict JSON matching:
{
  "questions": [
    {
      "id": "${skill.toLowerCase()}-1",
      "difficulty": "medium",
      "topic": "Topic Name",
      "question": "Question text?",
      "codeSnippet": null,
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "Why A is correct"
    },
    ...
  ]
}
Include: 1 easy, 2 medium, 2 hard questions. 4 options per question. Only JSON.`;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
          }
        })
      });

      clearTimeout(timeout);
      if (!response.ok) continue;

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = cleanAndParseJSON(content);

      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length >= 3) {
        return sanitizeQuestions(parsed.questions, skill, `Gemini (${model})`);
      }
    } catch (_) {
      // Try next model
    }
  }

  throw new Error('Gemini models failed to generate valid quiz questions');
}

/**
 * Generate using custom OpenAI-compatible endpoint or user API key
 */
async function generateWithOpenAICompatible(skill, customApiKey, baseURL = 'https://api.openai.com/v1') {
  if (!customApiKey) throw new Error('Custom API key required for OpenAI compatible provider');

  const systemPrompt = `You are an expert technical examiner. Return strictly pure JSON with an array of 5 questions for: "${skill}".
Keys required per question: id, difficulty (easy/medium/hard), topic, question, codeSnippet (or null), options (4 strings), correctIndex (0-3), explanation.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${customApiKey}`,
      'Content-Type': 'application/json'
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate 5 technical quiz questions for ${skill}.` }
      ],
      temperature: 0.3,
      max_tokens: 1800
    })
  });

  clearTimeout(timeout);
  if (!response.ok) throw new Error(`Custom API provider error: ${response.status}`);

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = cleanAndParseJSON(content);

  const questionsList = parsed?.questions || (Array.isArray(parsed) ? parsed : null);
  if (questionsList && questionsList.length >= 3) {
    return sanitizeQuestions(questionsList, skill, 'OpenAI-Compatible');
  }

  throw new Error('Failed to parse questions from custom API provider');
}

/**
 * High-quality Domain Fallback Engine
 * Generates structured, realistic technical questions if offline or if no API key is available
 */
function generateOfflineFallback(skill) {
  const norm = (skill || 'Software Engineering').trim();
  const cap = norm.charAt(0).toUpperCase() + norm.slice(1);
  const slug = norm.toLowerCase().replace(/[^a-z0-9]/g, '');

  return [
    {
      id: `${slug}-f1`,
      difficulty: 'easy',
      topic: `${cap} Fundamentals`,
      question: `Which statement best describes the primary architectural purpose of ${cap}?`,
      codeSnippet: null,
      options: [
        `It provides specialized abstractions and tools for solving domain problems in ${cap}.`,
        `It replaces the underlying operating system kernel entirely.`,
        `It is solely an image editing format with no runtime behavior.`,
        `It requires running exclusively inside an emulated browser environment.`
      ],
      correctIndex: 0,
      explanation: `${cap} provides high-level abstractions, standards, and patterns specifically designed to solve real-world problems in this domain efficiently.`
    },
    {
      id: `${slug}-f2`,
      difficulty: 'medium',
      topic: `${cap} Best Practices`,
      question: `When designing a production-grade system with ${cap}, what is considered an industry best practice?`,
      codeSnippet: null,
      options: [
        `Ignoring configuration errors and silencing runtime warnings.`,
        `Decoupling components, establishing explicit contracts, and applying automated verification.`,
        `Writing all logic in a single monolithic source file without modular boundaries.`,
        `Hardcoding environment secrets directly into repository version control.`
      ],
      correctIndex: 1,
      explanation: `Modularity, decoupled interfaces, and automated test coverage prevent regressions and ensure maintainability in production ${cap} deployments.`
    },
    {
      id: `${slug}-f3`,
      difficulty: 'medium',
      topic: `${cap} State & Error Handling`,
      question: `In ${cap}, how should unexpected exceptions or failure states ideally be managed?`,
      codeSnippet: null,
      options: [
        `Catching errors, logging contextual diagnostics, and failing gracefully or retrying idempotently.`,
        `Allowing the process to crash silently without emitting telemetry or exit logs.`,
        `Terminating the parent database server immediately upon error.`,
        `Disabling all error checking mechanisms in production to increase throughput.`
      ],
      correctIndex: 0,
      explanation: `Graceful error handling, structured logging, and idempotent retry strategies ensure resilience in ${cap} systems.`
    },
    {
      id: `${slug}-f4`,
      difficulty: 'hard',
      topic: `${cap} Performance Tuning`,
      question: `When diagnosing high latency or resource bottlenecks in ${cap}, which optimization yields the highest impact?`,
      codeSnippet: null,
      options: [
        `Profiling execution hot-paths, minimizing redundant allocations, and optimizing I/O bottlenecks.`,
        `Doubling CPU clock speed without analyzing profiler flamegraphs.`,
        `Replacing all asynchronous pipelines with synchronous blocking loops.`,
        `Increasing thread counts to unlimited without checking thread-pool saturation.`
      ],
      correctIndex: 0,
      explanation: `Profiler-guided optimization targeting memory allocation and I/O wait times produces measurable performance gains in ${cap}.`
    },
    {
      id: `${slug}-f5`,
      difficulty: 'hard',
      topic: `${cap} Concurrency & Reliability`,
      question: `How does ${cap} ensure reliability and data consistency under high concurrent throughput?`,
      codeSnippet: null,
      options: [
        `By avoiding locks and assuming operations will never execute concurrently.`,
        `Using synchronization primitives, atomic state transitions, or non-blocking event loops.`,
        `Restarting the entire cluster every minute to flush memory caches.`,
        `Relying on arbitrary client sleep timeouts to prevent race conditions.`
      ],
      correctIndex: 1,
      explanation: `Atomic transitions, proper locking protocols, or structured event-loop execution guarantee state integrity in concurrent ${cap} systems.`
    }
  ];
}

/**
 * Sanitize questions ensuring strict conformity to quiz schema
 */
function sanitizeQuestions(rawList, skill, providerName) {
  const norm = (skill || 'skill').toLowerCase().replace(/[^a-z0-9]/g, '');
  const difficulties = ['medium', 'easy', 'medium', 'hard', 'hard'];

  return rawList.slice(0, 5).map((q, idx) => {
    let opts = Array.isArray(q.options) && q.options.length >= 4
      ? q.options.slice(0, 4).map(String)
      : ['Option A', 'Option B', 'Option C', 'Option D'];

    let correct = Number(q.correctIndex);
    if (isNaN(correct) || correct < 0 || correct > 3) {
      correct = 0;
    }

    return {
      id: q.id || `${norm}-q${idx + 1}`,
      difficulty: q.difficulty || difficulties[idx] || 'medium',
      topic: q.topic || `${skill} Core`,
      question: q.question || `Question about ${skill}?`,
      codeSnippet: typeof q.codeSnippet === 'string' && q.codeSnippet.trim() ? q.codeSnippet.trim() : null,
      options: opts,
      correctIndex: correct,
      explanation: q.explanation || `Choice ${opts[correct]} is correct based on ${skill} specifications.`,
      provider: providerName
    };
  });
}

/**
 * Main entry point: Generates 5 adaptive questions for any skill using multi-model hierarchy
 */
async function generateAdaptiveSkillQuiz(skill, options = {}) {
  const {
    userApiKey = null,
    provider = 'auto', // 'auto' | 'groq' | 'gemini' | 'openai' | 'offline'
    skipCache = false
  } = options;

  const cacheKey = `${skill.toLowerCase()}_${provider}_${userApiKey ? 'custom' : 'server'}`;

  if (!skipCache && questionCache.has(cacheKey)) {
    const cached = questionCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        success: true,
        skill,
        provider: cached.provider,
        questions: cached.questions,
        cached: true
      };
    }
  }

  let questions = null;
  let activeProvider = 'offline';

  // 1. Explicit or Auto Groq
  if ((provider === 'auto' || provider === 'groq') && (userApiKey || process.env.GROQ_API_KEY)) {
    try {
      questions = await generateWithGroq(skill, userApiKey);
      activeProvider = 'groq';
    } catch (err) {
      console.warn(`[AIQuiz] Groq generation for "${skill}" failed: ${err.message}`);
    }
  }

  // 2. Explicit or Auto Gemini
  if (!questions && (provider === 'auto' || provider === 'gemini') && (userApiKey || process.env.GEMINI_API_KEY)) {
    try {
      questions = await generateWithGemini(skill, userApiKey);
      activeProvider = 'gemini';
    } catch (err) {
      console.warn(`[AIQuiz] Gemini generation for "${skill}" failed: ${err.message}`);
    }
  }

  // 3. Explicit Custom OpenAI-compatible
  if (!questions && (provider === 'openai' || userApiKey)) {
    try {
      questions = await generateWithOpenAICompatible(skill, userApiKey);
      activeProvider = 'openai';
    } catch (err) {
      console.warn(`[AIQuiz] Custom OpenAI generation for "${skill}" failed: ${err.message}`);
    }
  }

  // 4. Guaranteed Offline Domain Fallback
  if (!questions || questions.length < 3) {
    questions = generateOfflineFallback(skill);
    activeProvider = 'offline_engine';
  }

  // Save to cache
  questionCache.set(cacheKey, {
    questions,
    provider: activeProvider,
    timestamp: Date.now()
  });

  return {
    success: true,
    skill,
    provider: activeProvider,
    questions,
    cached: false
  };
}

/**
 * Return status of all configured AI providers on the server
 */
function getAvailableProviders() {
  return {
    groq: {
      available: Boolean(process.env.GROQ_API_KEY),
      model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      displayName: 'Groq Cloud (Llama / Qwen)',
      speed: '< 300ms',
      recommended: true
    },
    gemini: {
      available: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      displayName: 'Google Gemini',
      speed: '~1s',
      recommended: false
    },
    customKey: {
      available: true,
      displayName: 'Custom User API Key',
      supported: ['groq', 'gemini', 'openai']
    },
    offline: {
      available: true,
      displayName: 'Curated Question Bank & Offline Engine',
      speed: 'Instant (0ms)'
    }
  };
}

module.exports = {
  generateAdaptiveSkillQuiz,
  getAvailableProviders,
  generateWithGroq,
  generateWithGemini
};
