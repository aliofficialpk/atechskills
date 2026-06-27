import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  "courses.manage",
  "events.manage",
  "insights.manage",
  "users.manage",
  "support.manage",
  "certificates.issue",
  "website.manage",
  "roles.manage"
];

const rolePermissions: Record<string, string[]> = {
  "Super Admin": permissions,
  Admin: permissions,
  Teacher: ["courses.manage", "certificates.issue"],
  "Student Services": ["support.manage"],
  "Content Manager": ["insights.manage", "website.manage"],
  "Event Manager": ["events.manage"],
  Student: []
};

async function main() {
  for (const name of permissions) {
    await prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
  }

  const roles = new Map<string, string>();
  for (const roleName of Object.keys(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} platform role` }
    });
    roles.set(roleName, role.id);
  }

  const allPermissions = await prisma.permission.findMany();
  for (const [roleName, allowedPermissions] of Object.entries(rolePermissions)) {
    const roleId = roles.get(roleName);
    if (!roleId) continue;

    for (const permission of allPermissions) {
      if (!allowedPermissions.includes(permission.name)) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        update: {},
        create: { roleId, permissionId: permission.id }
      });
    }
  }

  const superAdminRoleId = roles.get("Super Admin");
  if (!superAdminRoleId) throw new Error("Super Admin role was not created");

  const passwordHash = await bcrypt.hash("admin234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@atechskills.com" },
    update: {
      name: "admin",
      passwordHash,
      isActive: true
    },
    create: {
      email: "admin@atechskills.com",
      name: "admin",
      passwordHash,
      roles: { create: { roleId: superAdminRoleId } }
    }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRoleId } },
    update: {},
    create: { userId: admin.id, roleId: superAdminRoleId }
  });

  const demoTeacher = await prisma.user.findUnique({ where: { email: "teacher@atechskills.com" }, include: { teacher: true } });
  if (demoTeacher?.teacher) {
    await prisma.course.updateMany({ where: { instructorId: demoTeacher.teacher.id }, data: { instructorId: null } });
  }
  if (demoTeacher) {
    await prisma.user.delete({ where: { id: demoTeacher.id } });
  }

  console.log({
    adminLogin: "admin",
    adminEmail: "admin@atechskills.com",
    password: "admin234",
    note: "Only the admin account is seeded. Create teachers and staff from the admin dashboard."
  });
}

main()
  .finally(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
