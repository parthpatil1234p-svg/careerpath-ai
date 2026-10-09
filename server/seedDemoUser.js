/**
 * seedDemoUser.js — Upsert official demo user (demouser@gmail.com / demo123)
 */

require('dotenv').config();
const { prisma } = require('./config/prisma');
const connectDB = require('./config/db');
const User = require('./models/User');
const Career = require('./models/Career');
const Skill = require('./models/Skill');
const Roadmap = require('./models/Roadmap');
const RoadmapTask = require('./models/RoadmapTask');
const { generateRoadmapTasks, calculateRoadmapProgress } = require('./services/roadmapService');

const seedDemoUser = async () => {
  console.log('🚀 Connecting to database to seed Demo User...');
  try {
    await connectDB();

    const email = 'demouser@gmail.com';
    const password = 'demo123';

    // 1. Remove existing demo user if exists to reset cleanly
    await User.deleteOne({ email });
    console.log(`Cleaned up old account for ${email} if any.`);

    // 2. Create fresh demo user
    const demoUser = new User({
      name: 'Demo Student',
      email: email,
      password: password, // will be hashed by pre-save hook
      role: 'student',
      isVerified: true,
      profileCompleted: true,
      hasCompletedSkillVerification: true,
      education: {
        course: 'BCA',
        branch: 'Computer Science',
        year: 'Third Year',
        college: 'G.H. Raisoni Skill Tech University',
      },
      interests: ['Web Development', 'Artificial Intelligence', 'Cloud Computing'],
      skills: [
        { name: 'html', displayName: 'HTML', proficiency: 'advanced', isCodeVerified: true, isQuizVerified: true, verifiedSource: 'GitHub Repositories' },
        { name: 'css', displayName: 'CSS', proficiency: 'advanced', isCodeVerified: true, isQuizVerified: true, verifiedSource: 'GitHub Repositories' },
        { name: 'javascript', displayName: 'JavaScript', proficiency: 'intermediate', isCodeVerified: true, isQuizVerified: true, verifiedSource: 'GitHub Repositories' },
        { name: 'react', displayName: 'React', proficiency: 'intermediate', isCodeVerified: true, isQuizVerified: false, verifiedSource: 'GitHub Repositories' },
        { name: 'node.js', displayName: 'Node.js', proficiency: 'intermediate', isCodeVerified: false, isQuizVerified: true, verifiedSource: 'quiz' },
        { name: 'express.js', displayName: 'Express.js', proficiency: 'intermediate', isCodeVerified: false, isQuizVerified: false },
        { name: 'mongodb', displayName: 'MongoDB', proficiency: 'intermediate', isCodeVerified: false, isQuizVerified: false },
        { name: 'python', displayName: 'Python', proficiency: 'beginner', isCodeVerified: true, isQuizVerified: true, verifiedSource: 'GitHub Repositories' },
        { name: 'git', displayName: 'Git', proficiency: 'intermediate', isCodeVerified: true, isQuizVerified: false, verifiedSource: 'GitHub Repositories' },
        { name: 'sql', displayName: 'SQL', proficiency: 'beginner', isCodeVerified: false, isQuizVerified: true, verifiedSource: 'quiz' },
      ],
      careerGoals: ['Full Stack Developer', 'AI / ML Engineer'],
    });

    await demoUser.save();
    console.log(`✅ Demo user created: ${demoUser.email} (ID: ${demoUser._id})`);

    // 3. Find Full Stack Developer or first available career
    const career = await Career.findOne({ slug: 'full-stack-developer' }).populate('requiredSkills.skill') ||
                   await Career.findOne().populate('requiredSkills.skill');

    if (career) {
      console.log(`🎯 Generating sample active roadmap for: ${career.title}...`);
      
      // Clean up any old roadmaps for this user
      const existingRoadmaps = await Roadmap.find({ user: demoUser._id });
      for (const r of existingRoadmaps) {
        await RoadmapTask.deleteMany({ roadmap: r._id });
      }
      await Roadmap.deleteMany({ user: demoUser._id });

      const { generatedFrom, taskDocuments } = generateRoadmapTasks(demoUser, career, 4);

      const roadmap = await Roadmap.create({
        user: demoUser._id,
        career: career._id,
        careerSnapshot: {
          title: career.title,
          slug: career.slug,
          shortDescription: career.shortDescription || 'Full Stack Engineering Path',
        },
        durationWeeks: 4,
        status: 'active',
        generatedFrom,
        totalTasks: taskDocuments.length,
        completedTasks: 0,
        progressPercentage: 0,
      });

      const tasksToInsert = taskDocuments.map((t) => ({
        ...t,
        roadmap: roadmap._id,
      }));

      const createdTasks = await RoadmapTask.insertMany(tasksToInsert);
      console.log(`✅ Created ${createdTasks.length} roadmap tasks.`);

      // Mark the first 2 tasks as completed to show initial progress
      if (createdTasks.length >= 2) {
        createdTasks[0].completed = true;
        createdTasks[0].completedAt = new Date();
        await createdTasks[0].save();

        createdTasks[1].completed = true;
        createdTasks[1].completedAt = new Date();
        await createdTasks[1].save();

        await calculateRoadmapProgress(roadmap._id);
        console.log(`✅ Progress metrics updated for demo user.`);
      }
    }

    console.log('\n=============================================');
    console.log('🎉 DEMO ACCOUNT READY:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('=============================================\n');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo user:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seedDemoUser();
