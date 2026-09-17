/**
 * controllers/skillController.js — Standardized Skill Catalog & Custom Skills
 *
 * Endpoints:
 *  - GET  /api/skills        (public — list active skills, filter by category/search)
 *  - POST /api/skills/custom (protected — register custom skill to catalog)
 */

const Skill = require('../models/Skill');
const skillsData = require('../data/skillsData');

/**
 * GET /api/skills
 * Returns all active skills.
 * Query params:
 *   - category: filter by category (frontend, backend, database, data, design, security, cloud, soft-skill, tool, other)
 *   - search: search by name or displayName
 */
const getSkills = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const query = { active: true };

    if (category && typeof category === 'string' && category.trim() !== '') {
      query.category = category.trim().toLowerCase();
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: regex }, { displayName: regex }];
    }

    let skills = [];
    try {
      skills = await Skill.find(query).select('-__v').sort({ category: 1, displayName: 1 });
    } catch (dbErr) {
      console.warn('⚠️ MongoDB Skill fetch failed, falling back to skillsData in-memory:', dbErr.message);
    }

    // Fallback to static seed data if DB collection empty or offline
    if (!skills || skills.length === 0) {
      let staticList = [...skillsData];
      if (category) {
        staticList = staticList.filter((s) => s.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        const term = search.toLowerCase();
        staticList = staticList.filter(
          (s) => s.name.toLowerCase().includes(term) || s.displayName.toLowerCase().includes(term)
        );
      }
      skills = staticList;
    }

    res.status(200).json({
      success: true,
      count: skills.length,
      data: { skills },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/skills/custom
 * Register a student's custom skill into the skill catalog.
 */
const addCustomSkill = async (req, res, next) => {
  try {
    const { name, displayName, category, description } = req.body;

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Skill display name is required',
      });
    }

    const cleanDisplayName = displayName.trim();
    const cleanName = (name && typeof name === 'string' && name.trim())
      ? name.trim().toLowerCase()
      : cleanDisplayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const validCategories = [
      'frontend',
      'backend',
      'database',
      'data',
      'design',
      'security',
      'cloud',
      'soft-skill',
      'tool',
      'other',
    ];

    const cleanCategory = validCategories.includes(String(category).toLowerCase())
      ? String(category).toLowerCase()
      : 'other';

    // Check if skill already exists in DB
    let existingSkill = await Skill.findOne({ name: cleanName });
    if (existingSkill) {
      return res.status(200).json({
        success: true,
        message: 'Skill already exists in catalog',
        data: { skill: existingSkill },
      });
    }

    const newSkill = await Skill.create({
      name: cleanName,
      displayName: cleanDisplayName,
      category: cleanCategory,
      description: (description && typeof description === 'string') ? description.slice(0, 300) : `Custom skill: ${cleanDisplayName}`,
      active: true,
    });

    res.status(201).json({
      success: true,
      message: 'Custom skill registered successfully',
      data: { skill: newSkill },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSkills,
  addCustomSkill,
};
