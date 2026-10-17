const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { prisma } = require('../server/config/prisma');

async function fixRoles() {
  console.log('--- CHECKING & ENSURING STRICT STUDENT ROLE FOR DEMOUSER ---');

  const spUser = await prisma.user.findUnique({ where: { email: 'demouser@gmail.com' } });
  if (spUser) {
    console.log('Supabase user role before:', spUser.role);
    if (spUser.role !== 'student') {
      await prisma.user.update({
        where: { email: 'demouser@gmail.com' },
        data: { role: 'student' }
      });
      console.log('Updated Supabase user role to student!');
    } else {
      console.log('User already has role: student');
    }
  }

  // Also check if any other student accounts have wrong roles
  const parthUser = await prisma.user.findUnique({ where: { email: 'parthpatil1234p@gmail.com' } });
  if (parthUser) {
    console.log('parthpatil1234p@gmail.com role:', parthUser.role);
  }

  console.log('✅ Demo user role verification complete!');
}

fixRoles().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  process.exit(0);
});
