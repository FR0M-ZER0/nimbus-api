-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "id_nivel_acesso" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "public"."nivel_acesso" (
    "id_nivel_acesso" SERIAL NOT NULL,
    "descricao" VARCHAR(50) NOT NULL,

    CONSTRAINT "nivel_acesso_pkey" PRIMARY KEY ("id_nivel_acesso")
);

-- CreateTable
CREATE TABLE "public"."estacao" (
    "id_estacao" INTEGER NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "endereco" VARCHAR(255),
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(10,8) NOT NULL,
    "descricao" TEXT,
    "data_criacao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "estacao_pkey" PRIMARY KEY ("id_estacao")
);

-- CreateTable
CREATE TABLE "public"."alerta" (
    "id_alerta" SERIAL NOT NULL,
    "id_tipo_alerta" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "data_criacao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mensagem" TEXT NOT NULL,

    CONSTRAINT "alerta_pkey" PRIMARY KEY ("id_alerta")
);

-- CreateTable
CREATE TABLE "public"."medida" (
    "id_medida" SERIAL NOT NULL,
    "id_parametro" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_hora" INTEGER NOT NULL,

    CONSTRAINT "medida_pkey" PRIMARY KEY ("id_medida")
);

-- CreateTable
CREATE TABLE "public"."parametro" (
    "id_parametro" INTEGER NOT NULL,
    "id_estacao" INTEGER NOT NULL,
    "id_tipo_parametro" INTEGER NOT NULL,
    "descricao" TEXT,
    "json" JSON NOT NULL,

    CONSTRAINT "parametro_pkey" PRIMARY KEY ("id_parametro")
);

-- CreateTable
CREATE TABLE "public"."tipo_parametro" (
    "id_tipo_parametro" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "unidade" VARCHAR(20) NOT NULL,
    "fator" INTEGER,
    "polinomio" DECIMAL(10,8),
    "offset" INTEGER,

    CONSTRAINT "tipo_parametro_pkey" PRIMARY KEY ("id_tipo_parametro")
);

-- CreateTable
CREATE TABLE "public"."tipo_alerta" (
    "id" SERIAL NOT NULL,
    "operador" VARCHAR(10) NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "id_parametro" INTEGER NOT NULL,

    CONSTRAINT "tipo_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_id_nivel_acesso_fkey" FOREIGN KEY ("id_nivel_acesso") REFERENCES "public"."nivel_acesso"("id_nivel_acesso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estacao" ADD CONSTRAINT "estacao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerta" ADD CONSTRAINT "alerta_id_tipo_alerta_fkey" FOREIGN KEY ("id_tipo_alerta") REFERENCES "public"."tipo_alerta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerta" ADD CONSTRAINT "alerta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medida" ADD CONSTRAINT "medida_id_parametro_fkey" FOREIGN KEY ("id_parametro") REFERENCES "public"."parametro"("id_parametro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parametro" ADD CONSTRAINT "parametro_id_estacao_fkey" FOREIGN KEY ("id_estacao") REFERENCES "public"."estacao"("id_estacao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parametro" ADD CONSTRAINT "parametro_id_tipo_parametro_fkey" FOREIGN KEY ("id_tipo_parametro") REFERENCES "public"."tipo_parametro"("id_tipo_parametro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tipo_alerta" ADD CONSTRAINT "tipo_alerta_id_parametro_fkey" FOREIGN KEY ("id_parametro") REFERENCES "public"."parametro"("id_parametro") ON DELETE RESTRICT ON UPDATE CASCADE;
