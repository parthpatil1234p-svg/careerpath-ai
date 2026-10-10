/**
 * controllers/careerController.js — Career Catalog Endpoints
 *
 * getCareers       GET /api/careers       (public, query: category, search)
 * getCareerBySlug  GET /api/careers/:slug (public)
 */

const Career = require('../models/Career');
const Skill = require('../models/Skill');
const { cacheManager } = require('../utils/cacheManager');

// ── getCareers ─────────────────────────────────────────────────
/**
 * GET /api/careers
 * Returns all active careers.
 * Supports query params:
 *   - category: filter by career category (e.g. "development", "data")
 *   - search: fuzzy search across title, shortDescription, and interestTags
 */
const getCareers = async (req, res, next) => {
  try {
    const { category, search, domain } = req.query;

    const normCategory = (category && typeof category === 'string') ? category.trim().toLowerCase() : '';
    const normSearch = (search && typeof search === 'string') ? search.trim().toLowerCase() : '';
    const normDomain = (domain && typeof domain === 'string') ? domain.trim().toLowerCase() : '';
    const cacheKey = `careers:list:${normDomain}:${normCategory}:${normSearch}`;

    const careers = await cacheManager.wrap(cacheKey, 3600, async () => {
      const query = { active: true };

      // Filter by domain (engineering, business, marketing, creative)
      if (normDomain) {
        query.domain = normDomain;
      }

      // Filter by category
      if (normCategory) {
        query.category = normCategory;
      }

      // Filter by search keyword
      if (normSearch) {
        const regex = new RegExp(normSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [
          { title: regex },
          { shortDescription: regex },
          { interestTags: regex },
        ];
      }

      return await Career.find(query)
        .select('-__v')
        .populate({
          path: 'requiredSkills.skill',
          select: 'name displayName category description',
        })
        .sort({ title: 1 })
        .lean();
    });

    // Public Edge CDN caching header: 5 mins browser, 1 hour CDN edge, stale-while-revalidate 1 day
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');

    res.status(200).json({
      success: true,
      count: careers.length,
      data: { careers },
    });
  } catch (error) {
    next(error);
  }
};

// ── getCareerBySlug ────────────────────────────────────────────
/**
 * GET /api/careers/:slug
 * Returns a single active career by its URL-friendly slug.
 */
const getCareerBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid career slug is required',
      });
    }

    const normSlug = slug.trim().toLowerCase();
    const cacheKey = `career:slug:${normSlug}`;

    const career = await cacheManager.wrap(cacheKey, 3600, async () => {
      return await Career.findOne({
        slug: normSlug,
        active: true,
      })
        .select('-__v')
        .populate({
          path: 'requiredSkills.skill',
          select: 'name displayName category description',
        })
        .lean();
    });

    if (!career) {
      return res.status(404).json({
        success: false,
        message: `Career with slug "${slug}" not found or is currently inactive`,
      });
    }

    // Public Edge CDN caching header
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');

    res.status(200).json({
      success: true,
      data: { career },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCareers,
  getCareerBySlug,
};
