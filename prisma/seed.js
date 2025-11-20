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


/*
Seed para preencher o banco com dados meteorologicos simulados.

import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando semeadura (Cenário: Estação Nova - 15 dias)...");

  // 1. Criar Nível Admin
  const nivelAdmin = await prisma.nivelAcesso.create({
    data: { descricao: "Administrador" },
  });

  // 2. Criar Usuário
  const usuario = await prisma.usuario.create({
    data: {
      nome: "Cliente Estação Nova",
      email: "teste15dias@nimbus.com", // Email novo para diferenciar
      senha: "123",
      id_nivel_acesso: nivelAdmin.id_nivel_acesso,
      ativo: true,
    },
  });
  console.log(`✅ Usuário criado: ${usuario.nome} (ID: ${usuario.id_usuario})`);

  // 3. Tipos de Parâmetros
  const tipoTemp = await prisma.tipoParametro.create({
    data: { nome: "Temperatura", unidade: "°C", json: {} },
  });
  const tipoUmid = await prisma.tipoParametro.create({
    data: { nome: "Umidade", unidade: "%", json: {} },
  });

  // 4. Estação
  const estacao = await prisma.estacao.create({
    data: {
      id_estacao: "EST-NEW-15",
      nome: "Estação Recém Instalada (Sul)",
      latitude: -23.55,
      longitude: -46.63,
      id_usuario: usuario.id_usuario,
    },
  });

  // Status ONLINE
  await prisma.estacaoStatus.create({
    data: {
      status: "ONLINE",
      id_estacao: estacao.id_estacao,
      created_at: new Date(),
    },
  });

  // 5. Sensores
  const paramTemp = await prisma.parametro.create({
    data: {
      id_estacao: estacao.id_estacao,
      id_tipo_parametro: tipoTemp.id_tipo_parametro,
    },
  });
  const paramUmid = await prisma.parametro.create({
    data: {
      id_estacao: estacao.id_estacao,
      id_tipo_parametro: tipoUmid.id_tipo_parametro,
    },
  });

  // 6. GERAR MEDIDAS (A MUDANÇA ESTÁ AQUI)
  console.log("⏳ Gerando histórico parcial (Apenas últimos 15 dias)...");

  const medidasTemp = [];
  const medidasUmid = [];
  const agora = new Date();

  // Configuração da Simulação
  const DIAS_HISTORICO = 15; // <--- Mudamos de 30 para 15
  const LEITURAS_POR_DIA = 4;
  const TOTAL_ITERACOES = DIAS_HISTORICO * LEITURAS_POR_DIA;

  for (let i = 0; i < TOTAL_ITERACOES; i++) {
    const dataLeitura = new Date();
    // Recua no tempo a cada iteração (6 horas)
    dataLeitura.setHours(agora.getHours() - i * 6);

    const timestamp = Math.floor(dataLeitura.getTime() / 1000);

    // Gera valores aleatórios
    medidasTemp.push({
      id_parametro: paramTemp.id_parametro,
      valor: 20 + Math.random() * 15,
      data_hora: timestamp,
    });

    medidasUmid.push({
      id_parametro: paramUmid.id_parametro,
      valor: 40 + Math.random() * 50,
      data_hora: timestamp,
    });
  }

  await prisma.medida.createMany({ data: medidasTemp });
  await prisma.medida.createMany({ data: medidasUmid });

  console.log(
    `✅ ${
      medidasTemp.length + medidasUmid.length
    } medidas inseridas (aprox. 60 por sensor).`
  );

  // 7. Criar Alertas (Opcional, para testar se aparecem)
  const alertaTemp = await prisma.alerta.create({
    data: {
      titulo: "Instalação Recente",
      texto: "Monitoramento iniciado com sucesso.",
      id_parametro: paramTemp.id_parametro,
    },
  });

  // Cria um registro de alarme na medida mais recente
  const medidaRecente = await prisma.medida.findFirst({
    where: { id_parametro: paramTemp.id_parametro },
    orderBy: { data_hora: "desc" },
  });

  if (medidaRecente) {
    await prisma.alarme.create({
      data: {
        id_usuario: usuario.id_usuario,
        id_medida: medidaRecente.id_medida,
        id_alerta: alertaTemp.id_alerta,
        created_at: new Date(),
      },
    });
  }

  console.log("🚀 Seed de 15 dias finalizado!");
  console.log(`👉 USE ESTE ID NO POSTMAN: ${usuario.id_usuario}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
*/