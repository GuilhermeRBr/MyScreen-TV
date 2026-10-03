import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

async function seedSysadmin(): Promise<void> {
  const email = process.env.SYSADMIN_EMAIL;
  const password = process.env.SYSADMIN_PASSWORD;
  const username = process.env.SYSADMIN_USERNAME;
  const displayName = process.env.SYSADMIN_DISPLAY_NAME;

  if (!email || !password || !username || !displayName) {
    throw new Error(
      'Variaveis de ambiente do sysadmin nao configuradas: SYSADMIN_EMAIL, SYSADMIN_PASSWORD, SYSADMIN_USERNAME, SYSADMIN_DISPLAY_NAME',
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
    },
    select: { id: true, email: true, role: true },
  });

  if (existing) {
    if (existing.role === UserRole.ADMIN) {
      console.log(`Sysadmin ja existe (id: ${existing.id}), nenhuma alteracao feita.`);
      return;
    }

    // Existe um usuario com o mesmo email/username mas sem role ADMIN — promover
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: UserRole.ADMIN },
    });

    console.log(`Usuario existente promovido para ADMIN (id: ${existing.id}).`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const sysadmin = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      displayName,
      role: UserRole.ADMIN,
    },
    select: { id: true, email: true, username: true, role: true },
  });

  console.log(`Sysadmin criado com sucesso:`);
  console.log(`  id:       ${sysadmin.id}`);
  console.log(`  email:    ${sysadmin.email}`);
  console.log(`  username: ${sysadmin.username}`);
  console.log(`  role:     ${sysadmin.role}`);
}

async function main(): Promise<void> {
  console.log('Iniciando seed...');

  await seedSysadmin();

  console.log('Seed concluido.');
}

main()
  .catch((error: unknown) => {
    console.error('Erro ao executar seed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
