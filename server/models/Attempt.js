/**
 * models/Attempt.js — Pure Prisma ORM Attempt Model
 *
 * Implements Mongoose-compatible interface for skill quizzes & milestone tests.
 * Powered 100% by Supabase PostgreSQL via Prisma Client.
 * CareerPath AI Technologies Inc. · 0% MongoDB Architecture
 */

const { createPrismaModel, PrismaDocument } = require('./prismaBase');

class AttemptDocument extends PrismaDocument {
  constructor(data = {}, modelName = 'Attempt', fieldMap = { user: 'userId', roadmap: 'roadmapId' }, isNew = false) {
    super(data, modelName, fieldMap, isNew);
  }
}

const AttemptModel = createPrismaModel('Attempt', {
  user: 'userId',
  roadmap: 'roadmapId',
});

const Attempt = function (data = {}) {
  return new AttemptDocument(data, 'Attempt', { user: 'userId', roadmap: 'roadmapId' }, true);
};

Object.assign(Attempt, AttemptModel);

const origFindOne = AttemptModel.findOne;
Attempt.findOne = function (filter = {}) {
  const query = origFindOne.call(AttemptModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new AttemptDocument(res, 'Attempt', { user: 'userId', roadmap: 'roadmapId' });
  };
  return query;
};

const origFindById = AttemptModel.findById;
Attempt.findById = function (id) {
  const query = origFindById.call(AttemptModel, id);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const res = await origExec();
    if (!res || query._isLean) return res;
    return new AttemptDocument(res, 'Attempt', { user: 'userId', roadmap: 'roadmapId' });
  };
  return query;
};

const origFind = AttemptModel.find;
Attempt.find = function (filter = {}) {
  const query = origFind.call(AttemptModel, filter);
  const origExec = query.exec.bind(query);
  query.exec = async function () {
    const list = await origExec();
    if (query._isLean) return list;
    return list.map((doc) => new AttemptDocument(doc, 'Attempt', { user: 'userId', roadmap: 'roadmapId' }));
  };
  return query;
};

module.exports = Attempt;
