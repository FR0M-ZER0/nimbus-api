// prisma/seed.js
import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed...');

  // 1. Garantir níveis de acesso: "Administrador" e "Publico"
  const niveis = ['Administrador', 'Publico'];
  const createdLevels = {};

  for (const descricao of niveis) {
    let nivel = await prisma.nivelAcesso.findFirst({
      where: { descricao }
    });

    if (!nivel) {
      nivel = await prisma.nivelAcesso.create({
        data: { descricao }
      });
      console.log(`Nível de acesso '${descricao}' criado com ID ${nivel.id_nivel_acesso}.`);
    } else {
      console.log(`Nível de acesso '${descricao}' já existe com ID ${nivel.id_nivel_acesso}.`);
    }

    createdLevels[descricao] = nivel;
  }

  // 2. Criar usuário admin com senha hasheada
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      nome: 'Admin',
      email: 'admin@example.com',
      senha: hashedPassword,
      id_nivel_acesso: createdLevels['Administrador'].id_nivel_acesso,
    },
  });
  console.log(`Usuário '${adminUser.nome}' criado/verificado com sucesso.`);

  // Opcional: Criar um usuário público de exemplo
  const publicUser = await prisma.usuario.upsert({
    where: { email: 'publico@example.com' },
    update: {},
    create: {
      nome: 'Usuário Público',
      email: 'publico@example.com',
      senha: await bcrypt.hash('public123', 10),
      id_nivel_acesso: createdLevels['Publico'].id_nivel_acesso,
    },
  });
  console.log(`Usuário público '${publicUser.nome}' criado/verificado com sucesso.`);

  console.log('Seed finalizado com sucesso.');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });