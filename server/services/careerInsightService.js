/**
 * careerInsightService.js — AI-Powered Career Fit Brief & Market Insights
 * Powered by Groq Cloud & Google Gemini
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const { callGroq } = require('./groqService');
const { callGemini } = require('./geminiService');

// High-fidelity fallback market telemetry for verified roles (India 2026-27 tech landscape)
const DEFAULT_MARKET_INSIGHTS = {
  'front-end-developer': {
    salaryRange: '₹4.5 – ₹9.0 LPA (Entry-Level)',
    hiringDemand: 'High Demand · 35,000+ open roles across product startups & IT services',
    whyYouFit: 'Your visual creativity and frontend coding interests provide a natural transition into modern responsive UI engineering.',
    keyBottleneck: 'Mastering modern component state management and REST API integration is critical for technical hiring rounds.',
    actionableTip: 'Build a production-grade dashboard with responsive layout and clean component architecture on GitHub.'
  },
  'full-stack-developer': {
    salaryRange: '₹6.0 – ₹12.0 LPA (Entry-Level)',
    hiringDemand: 'Very High Demand · Most sought-after role for high-velocity startup engineering teams',
    whyYouFit: 'Your balanced technical interests make you an ideal candidate to build complete end-to-end web applications.',
    keyBottleneck: 'Connecting decoupled frontends with secure backend REST APIs and database schema design.',
    actionableTip: 'Create an authenticated full-stack CRUD application with JWT and MongoDB Atlas to prove production readiness.'
  },
  'data-analyst': {
    salaryRange: '₹4.5 – ₹8.5 LPA (Entry-Level)',
    hiringDemand: 'Fast Growing · Surging enterprise demand for business intelligence and data pipelines',
    whyYouFit: 'Your analytical mindset and quantitative background fit right into modern decision intelligence and data transformation.',
    keyBottleneck: 'Translating raw database SQL queries into clear business visual storytelling and statistical summaries.',
    actionableTip: 'Publish an interactive data visualization case study using Python (Pandas/Seaborn) or SQL on public Kaggle datasets.'
  },
  'ui-ux-designer': {
    salaryRange: '₹4.0 – ₹8.0 LPA (Entry-Level)',
    hiringDemand: 'High Demand · Crucial role in consumer apps, fintech, and AI user experience design',
    whyYouFit: 'Your design thinking and empathy for user workflows give you a strong edge in crafting intuitive product interfaces.',
    keyBottleneck: 'Creating systematic Figma design components, wireframing, and usability testing documentation.',
    actionableTip: 'Document a complete end-to-end case study from problem statement to interactive Figma prototype in your portfolio.'
  },
  'cybersecurity-analyst': {
    salaryRange: '₹5.5 – ₹11.0 LPA (Entry-Level)',
    hiringDemand: 'Critical Shortage · Rapidly expanding regulatory compliance and security operations centers',
    whyYouFit: 'Your interest in networks and systems security aligns directly with SOC defense and vulnerability assessments.',
    keyBottleneck: 'Practical hands-on familiarity with Linux CLI security tools, network packet analysis, and OWASP Top 10.',
    actionableTip: 'Document practical labs on TryHackMe or HackTheBox and write technical walkthroughs of security fundamentals.'
  }
};

// Circuit breakers to prevent repeated dead HTTP roundtrips when API keys are invalid or network is down
let groqCircuitOpenUntil = 0;
let geminiCircuitOpenUntil = 0;

/**
 * Generates an AI-Powered Career Fit Brief for a recommendation
 * @param {Object} recommendation - Scored recommendation object
 * @param {Object} user - User document
 * @returns {Promise<Object>} Enriched aiBrief
 */
async function generateCareerBrief(recommendation, user) {
  const career = recommendation.career;
  const slug = career.slug || '';
  const fallback = DEFAULT_MARKET_INSIGHTS[slug] || DEFAULT_MARKET_INSIGHTS['front-end-developer'];

  const matchedNames = (recommendation.matchedSkills || []).map(s => s.displayName || s.name).join(', ') || 'Foundational tech basics';
  const missingNames = (recommendation.missingSkills || []).map(s => s.displayName || s.name).join(', ') || 'Advanced frameworks';
  const educationText = user.education?.course ? `${user.education.course} ${user.education.branch || ''}`.trim() : 'College Student';

  const promptMessages = [
    {
      role: 'system',
      content: `You are an expert Indian Tech Industry Talent Analyst for the Hack2Ignite 2026-27 hackathon.
Generate an executive Career Fit & Market Brief for this college student.
Return strictly a raw, valid JSON object (no markdown code fences, no extra text) with these 5 keys:
{
  "salaryRange": "e.g. ₹5.0 – ₹9.5 LPA (Entry-Level in India)",
  "hiringDemand": "e.g. Very High · 40,000+ openings across tech startups",
  "whyYouFit": "2 clear sentences explaining why their specific skills and degree make them a solid candidate for this role.",
  "keyBottleneck": "1 concise sentence stating the exact primary missing skill or concept they must master first to become hireable.",
  "actionableTip": "1 practical, actionable tip for building a standout portfolio project for this role."
}`
    },
    {
      role: 'user',
      content: `Target Role: ${career?.title || 'Unknown Role'}
Student Education: ${educationText}
Student Matched Skills: ${matchedNames}
Missing Skills to build: ${missingNames}
Match Score: ${recommendation.finalScore || 'N/A'}%`
    }
  ];

  // 1. Try Groq for ultra-fast generation (<100ms) if circuit is closed
  if (process.env.GROQ_API_KEY && Date.now() > groqCircuitOpenUntil) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const raw = await callGroq(promptMessages, controller.signal);
      clearTimeout(timeoutId);

      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.salaryRange && parsed.whyYouFit) {
        return {
          ...fallback,
          ...parsed,
          generatedByAI: true,
          engine: 'Groq Cloud',
        };
      }
    } catch (groqErr) {
      if (groqErr.message?.includes('Invalid API Key') || groqErr.message?.includes('401')) {
        groqCircuitOpenUntil = Date.now() + 10 * 60 * 1000; // Trip circuit for 10 minutes
        console.warn('⚠️  [FastPath] Groq API key invalid; circuit opened for 10 minutes.');
      }
      // Continue to Gemini fallback
    }
  }

  // 2. Fallback to Gemini if Groq failed or not configured and circuit is closed
  if (process.env.GEMINI_API_KEY && Date.now() > geminiCircuitOpenUntil) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const systemContent = promptMessages[0].content;
      const userContent = promptMessages[1].content;
      const raw = await callGemini(
        [{ role: 'user', parts: [{ text: userContent }] }],
        null,
        controller.signal,
        systemContent
      );
      clearTimeout(timeoutId);

      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.salaryRange && parsed.whyYouFit) {
        return {
          ...fallback,
          ...parsed,
          generatedByAI: true,
          engine: 'Google Gemini',
        };
      }
    } catch (geminiErr) {
      if (geminiErr.message?.includes('API key not valid') || geminiErr.message?.includes('400')) {
        geminiCircuitOpenUntil = Date.now() + 10 * 60 * 1000; // Trip circuit for 10 minutes
        console.warn('⚠️  [FastPath] Gemini API key invalid; circuit opened for 10 minutes.');
      }
      // Continue to static fallback
    }
  }

  // 3. Guaranteed High-Fidelity Static Fallback (Instant 0ms)
  return {
    ...fallback,
    generatedByAI: false,
    engine: 'CareerPath Telemetry Engine',
  };
}

/**
 * Enriches an array of recommendations with AI Career Fit Briefs
 * @param {Array} recommendations - Ranked recommendations
 * @param {Object} user - User document
 * @returns {Promise<Array>} Enriched recommendations
 */
async function enrichRecommendationsWithAI(recommendations, user) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return recommendations;
  }

  // Generate briefs in parallel for speed
  const enriched = await Promise.all(
    recommendations.map(async (rec) => {
      try {
        const aiBrief = await generateCareerBrief(rec, user);
        return {
          ...rec,
          aiBrief,
        };
      } catch (e) {
        return {
          ...rec,
          aiBrief: DEFAULT_MARKET_INSIGHTS[rec.career?.slug] || DEFAULT_MARKET_INSIGHTS['front-end-developer'],
        };
      }
    })
  );

  return enriched;
}

module.exports = {
  enrichRecommendationsWithAI,
  generateCareerBrief,
  DEFAULT_MARKET_INSIGHTS,
};
