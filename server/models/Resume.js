/**
 * models/Resume.js — Pure Prisma ORM Resume Model
 *
 * Implements Mongoose-compatible interface for uploaded resumes.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * CareerPath AI Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel, PrismaDocument } = require('./prismaBase');

class ResumeDocument extends PrismaDocument {
  constructor(data = {}, modelName = 'Resume', fieldMap = { user: 'userId' }, isNew = false) {
    super(data, modelName, fieldMap, isNew);
  }
}

const ResumeModel = createPrismaModel('Resume', {
  user: 'userId',
});

const Resume = function (data = {}) {
  return new ResumeDocument(data, 'Resume', { user: 'userId' }, true);
};

Object.assign(Resume, ResumeModel);

// findOneAndUpdate helper
Resume.findOneAndUpdate = async function (filter, update, options = {}) {
  const where = { ...filter };
  if (where.user) {
    where.userId = String(where.user);
    delete where.user;
  }
  if (where._id) {
    where.id = String(where._id);
    delete where._id;
  }

  const existing = await Resume.findOne(where);
  if (!existing && options.upsert) {
    const createData = { ...filter, ...update.$set, ...update };
    delete createData.$set;
    return Resume.create(createData);
  }
  if (!existing) return null;

  return Resume.findByIdAndUpdate(existing.id, update, options);
};

const origFindOne = ResumeModel.findOne;
Resume.findOne = function (filter = {}) {
  const query = origFindOne.call(ResumeModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new ResumeDocument(res, 'Resume', { user: 'userId' });
  };
  return query;
};

const origFindById = ResumeModel.findById;
Resume.findById = function (id) {
  const query = origFindById.call(ResumeModel, id);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new ResumeDocument(res, 'Resume', { user: 'userId' });
  };
  return query;
};

module.exports = Resume;
