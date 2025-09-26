// prisma/seed.js
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando o processo de seed...');

    // 1. Criar um Nível de Acesso (se não existir)
    const adminLevel = await prisma.nivelAcesso.upsert({
        where: { id_nivel_acesso: 1 }, // Tenta encontrar pelo ID 1
        update: {}, // Se encontrar, não faz nada
        create: { // Se não encontrar, cria
            id_nivel_acesso: 1,
            descricao: 'Administrador'
        },
    });
    console.log(`Nível de acesso '${adminLevel.descricao}' garantido.`);

    // 2. Criar um Usuário Administrador
    const adminUser = await prisma.usuario.upsert({
        where: { email: 'admin@example.com' }, // Tenta encontrar pelo email
        update: {}, // Se encontrar, não faz nada
        create: {
            nome: 'Admin',
            email: 'admin@example.com',
            // Em um app real, a senha deve ser criptografada (hash)
            // Para o seed, vamos usar uma senha simples
            senha: 'admin123', 
            id_nivel_acesso: adminLevel.id_nivel_acesso, // Associa ao nível de acesso criado
        },
    });
    console.log(`Usuário '${adminUser.nome}' criado com sucesso.`);

    console.log('Seed finalizado.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });