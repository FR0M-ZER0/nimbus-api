import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed...');

  // 1. Níveis de Acesso
  console.log('--- Criando Níveis de Acesso ---');
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

  // 2. Usuários
  console.log('\n--- Criando Usuários ---');
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
  console.log(`Usuário '${adminUser.nome}' verificado/criado com sucesso.`);

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
  console.log(`Usuário público '${publicUser.nome}' verificado/criado com sucesso.`);

  // 3. Tipo de Parâmetro
  console.log('\n--- Criando Tipo de Parâmetro ---');
  let tipoParametroTemp = await prisma.tipoParametro.findFirst({
      where: { nome: 'Temperatura' }
  });

  if (!tipoParametroTemp) {
      tipoParametroTemp = await prisma.tipoParametro.create({
          data: {
              nome: 'Temperatura',
              unidade: '°C',
          },
      });
      console.log(`Tipo de parâmetro '${tipoParametroTemp.nome}' criado com sucesso.`);
  } else {
      console.log(`Tipo de parâmetro '${tipoParametroTemp.nome}' já existe.`);
  }


  // 4. Estação
  console.log('\n--- Criando Estação ---');
  const estacao = await prisma.estacao.upsert({
    where: { id_estacao: 1 }, // Usando um ID fixo para consistência no seed
    update: {},
    create: {
      id_estacao: 1,
      nome: 'Estufa Principal',
      endereco: 'Rua das Flores, 123',
      latitude: -23.1791,
      longitude: -45.8872,
      descricao: 'Estação de monitoramento da estufa principal.',
      id_usuario: adminUser.id_usuario,
    }
  });
  console.log(`Estação '${estacao.nome}' verificada/criada com sucesso.`);
  
  // 5. Parâmetro
  console.log('\n--- Criando Parâmetro ---');
  const parametro = await prisma.parametro.upsert({
      where: { id_parametro: 1 }, // Usando um ID fixo
      update: {},
      create: {
          id_parametro: 1,
          id_estacao: estacao.id_estacao,
          id_tipo_parametro: tipoParametroTemp.id_tipo_parametro,
          descricao: 'Sensor de temperatura do ambiente',
          json: { "posicao": "centro" }
      }
  });
  console.log(`Parâmetro '${parametro.descricao}' verificado/criado com sucesso.`);

  // 6. Medida
  console.log('\n--- Criando Medida ---');
  const medida = await prisma.medida.create({
      data: {
          id_parametro: parametro.id_parametro,
          valor: 25.5,
          data_hora: Math.floor(Date.now() / 1000), // Timestamp Unix em segundos
      }
  });
  console.log(`Medida com valor '${medida.valor}' criada para o parâmetro ID ${medida.id_parametro}.`);

  // 7. Tipo de Alerta (Regra)
  console.log('\n--- Criando Tipo de Alerta ---');
  const tipoAlerta = await prisma.tipoAlerta.create({
      data: {
          id_parametro: parametro.id_parametro,
          operador: '>',
          valor: 30.0,
      }
  });
  console.log(`Tipo de Alerta (regra) criado: se valor > ${tipoAlerta.valor}.`);

  // 8. Alerta (Ocorrência)
  console.log('\n--- Criando Alerta ---');
  const alerta = await prisma.alerta.create({
      data: {
          id_tipo_alerta: tipoAlerta.id,
          id_usuario: adminUser.id_usuario,
          mensagem: 'Alerta de teste: Temperatura acima do limite configurado.'
      }
  });
  console.log(`Alerta criado com a mensagem: "${alerta.mensagem}".`);


  console.log('\nSeed finalizado com sucesso.');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

