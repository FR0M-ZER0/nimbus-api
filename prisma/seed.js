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
    let nivel = await prisma.nivelAcesso.findFirst({ where: { descricao } });

    if (!nivel) {
      nivel = await prisma.nivelAcesso.create({ data: { descricao } });
      console.log(`Nível de acesso '${descricao}' criado com ID ${nivel.id_nivel_acesso}.`);
    } else {
      console.log(`Nível de acesso '${descricao}' já existe com ID ${nivel.id_nivel_acesso}.`);
    }

    createdLevels[descricao] = nivel;
  }

  // 2. Usuários
  console.log('\n--- Criando Usuários ---');
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.usuario.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      nome: 'Admin',
      email: 'admin@example.com',
      senha: hashedAdminPassword,
      id_nivel_acesso: createdLevels['Administrador'].id_nivel_acesso,
      ativo: true,
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
      ativo: true,
    },
  });
  console.log(`Usuário público '${publicUser.nome}' verificado/criado com sucesso.`);

  // 3. Tipo de Parâmetro
  console.log('\n--- Criando Tipo de Parâmetro ---');
  let tipoParametroTemp = await prisma.tipoParametro.findFirst({ where: { nome: 'Temperatura' } });

  if (!tipoParametroTemp) {
    tipoParametroTemp = await prisma.tipoParametro.create({
      data: { 
        nome: 'Temperatura', 
        unidade: '°C',
        json: { plu: 1 }
      },
    });
    console.log(`Tipo de parâmetro '${tipoParametroTemp.nome}' criado com sucesso.`);
  } else {
    console.log(`Tipo de parâmetro '${tipoParametroTemp.nome}' já existe.`);
  }

  // 4. Estação
  console.log('\n--- Criando Estação ---');
  const estacao = await prisma.estacao.upsert({
    where: { id_estacao: 'EST001' },
    update: {},
    create: {
      id_estacao: 'EST001',
      nome: 'Estufa Principal',
      endereco: 'Rua das Flores - Amazonas/AM',
      latitude: -23.1791,
      longitude: -45.8872,
      descricao: 'Estação de monitoramento da estufa principal.',
      id_usuario: adminUser.id_usuario,
    },
  });
  console.log(`Estação '${estacao.nome}' verificada/criada com sucesso.`);

  // 5. Parâmetro
  console.log('\n--- Criando Parâmetro ---');
  const parametro = await prisma.parametro.upsert({
    where: { id_parametro: 1 },
    update: {},
    create: {
      id_parametro: 1,
      id_estacao: estacao.id_estacao,
      id_tipo_parametro: tipoParametroTemp.id_tipo_parametro,
      descricao: 'Sensor de temperatura do ambiente',
    },
  });
  console.log(`Parâmetro '${parametro.descricao}' verificado/criado com sucesso.`);

  // 6. Medida
  console.log('\n--- Criando Medida ---');
  const medida = await prisma.medida.create({
    data: {
      id_parametro: parametro.id_parametro,
      valor: 25.5,
      data_hora: 1761571160,
    },
  });
  console.log(`Medida com valor '${medida.valor}' criada para o parâmetro ID ${medida.id_parametro}.`);

  // 7. Tipo de Alerta (Regra)
  console.log('\n--- Criando Tipo de Alerta ---');
  const tipoAlerta = await prisma.tipoAlerta.create({
    data: {
      operador: '>',
      valor: 30.0,
    },
  });
  console.log(`Tipo de Alerta (regra) criado: se valor > ${tipoAlerta.valor}.`);

  // 8. Alerta (Ocorrência)
  console.log('\n--- Criando Alerta ---');
  const alerta = await prisma.alerta.create({
    data: {
      id_tipo_alerta: tipoAlerta.id,
      id_parametro: parametro.id_parametro,
      titulo: 'Alerta de Teste',
      texto: 'Temperatura acima do limite configurado.',
    },
  });
  console.log(`Alerta criado com a mensagem: "${alerta.texto}".`);

  // 9. Relacionar alerta com usuário (AlertaUsuario)
  await prisma.alertaUsuario.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_alerta: alerta.id_alerta,
    },
  });
  console.log(`Alerta vinculado ao usuário ${adminUser.nome}.`);

  // 10. Criar Alarme (associando medida + alerta + usuário)
  await prisma.alarme.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_medida: medida.id_medida,
      id_alerta: alerta.id_alerta,
    },
  });
  console.log(`Alarme registrado para o usuário ${adminUser.nome}.`);

  // 11. EstacaoStatus
  console.log('\n--- Criando EstacaoStatus ---');
  const estacaoStatus = await prisma.estacaoStatus.create({
    data: {
      status: 'ONLINE',
      id_estacao: estacao.id_estacao,
    },
  });
  console.log(`Status da estação '${estacao.id_estacao}' criado como '${estacaoStatus.status}'.`);

  // 12. EstacaoLog
  console.log('\n--- Criando EstacaoLog ---');
  const estacaoLog = await prisma.estacaoLog.create({
    data: {
      data_sent: 512,
      id_estacao: estacao.id_estacao,
    },
  });
  console.log(`Log de estação criado com ${estacaoLog.data_sent} KB enviados.`);

  // 13. DataProcessingLog
  console.log('\n--- Criando DataProcessingLog ---');
  const dataProcessingLog = await prisma.dataProcessingLog.create({
    data: {},
  });
  console.log(`Log de processamento de dados criado com ID ${dataProcessingLog.id_log}.`);

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
