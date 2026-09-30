/**
 * controllers/resumeController.js — AI Resume ATS Scoring & Keyword Optimization
 *
 * Team 404 Brain Not Found · Hack2Ignite 2026–27
 */

const User = require('../models/User');
const Roadmap = require('../models/Roadmap');
const { analyzeResumeText } = require('../services/resumeAnalyzerService');

/**
 * POST /api/resume/analyze
 * Analyzes resume text or user profile against a target career.
 */
exports.analyzeResume = async (req, res, next) => {
  try {
    const { resumeText, targetCareer } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Determine target career title
    let selectedCareer = targetCareer;
    if (!selectedCareer) {
      const activeRoadmap = await Roadmap.findOne({ user: user._id, status: 'active' }).populate('career');
      selectedCareer = activeRoadmap?.career?.title || (user.interests && user.interests[0]) || 'Full-Stack Developer';
    }

    // Determine text to analyze: provided resumeText, or extract from user.resumeUrl, or profile skills fallback
    let textToAnalyze = resumeText;
    if (!textToAnalyze || textToAnalyze.trim().length < 50) {
      if (user.resumeUrl) {
        try {
          const { downloadResumeBuffer } = require('../services/cloudinaryService');
          const { PDFParse } = require('pdf-parse');
          const { data } = await downloadResumeBuffer(user.resumeUrl);
          if (data && data.length > 0) {
            const parser = new PDFParse({ data });
            await parser.load();
            const parseRes = await parser.getText();
            if (parseRes && typeof parseRes.text === 'string' && parseRes.text.trim().length > 50) {
              textToAnalyze = parseRes.text.trim();
            }
          }
        } catch (pdfErr) {
          console.warn('[resumeController.analyzeResume] Note on resumeUrl extraction:', pdfErr.message);
        }
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length < 50) {
      const skillsStr = (user.skills || []).map(s => `${s.displayName || s.name} (${s.proficiency})`).join(', ');
      const reposStr = (user.githubRepos || []).map(r => `${r.name}: ${r.description} [${r.detectedSkills?.join(', ')}]`).join('\n');
      textToAnalyze = `
Candidate Name: ${user.name}
Email: ${user.email}
Education: ${user.education?.course || 'Computer Science'} from ${user.education?.college || 'University'} (${user.education?.year || 'Final Year'})
Technical Skills: ${skillsStr}
Projects and Repositories:
${reposStr || 'Full-stack web applications with authentication, databases, and responsive UI.'}
Target Objective: Passionate software engineer seeking roles in ${selectedCareer}.
      `.trim();
    }

    const analysisResult = await analyzeResumeText(textToAnalyze, selectedCareer, user.skills || []);

    // Persist to user record
    user.resumeAnalysis = analysisResult;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Resume ATS analysis generated successfully!',
      data: analysisResult
    });
  } catch (error) {
    console.error('[ResumeController.analyzeResume] Error:', error.message);
    next(error);
  }
};

/**
 * GET /api/resume/analysis
 * Returns the student's existing or latest resume ATS evaluation.
 */
exports.getResumeAnalysis = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.resumeAnalysis && user.resumeAnalysis.atsScore) {
      return res.status(200).json({
        success: true,
        data: user.resumeAnalysis
      });
    }

    // Generate initial baseline analysis if not already created
    const activeRoadmap = await Roadmap.findOne({ user: user._id, status: 'active' }).populate('career');
    const targetCareer = activeRoadmap?.career?.title || (user.interests && user.interests[0]) || 'Software Engineer';
    const skillsStr = (user.skills || []).map(s => `${s.displayName || s.name} (${s.proficiency})`).join(', ');

    const baselineText = `
Candidate: ${user.name}
Education: ${user.education?.course || 'Engineering'}
Skills: ${skillsStr || 'JavaScript, HTML, CSS, Git'}
Objective: Aspiring ${targetCareer}
    `.trim();

    const baseline = await analyzeResumeText(baselineText, targetCareer, user.skills || []);
    user.resumeAnalysis = baseline;
    await user.save();

    return res.status(200).json({
      success: true,
      data: baseline
    });
  } catch (error) {
    next(error);
  }
};
