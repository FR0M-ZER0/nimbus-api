/*
  Warnings:

  - You are about to drop the column `data_criacao` on the `alerta` table. All the data in the column will be lost.
  - You are about to drop the column `id_tipo_alerta` on the `alerta` table. All the data in the column will be lost.
  - You are about to drop the column `mensagem` on the `alerta` table. All the data in the column will be lost.
  - You are about to drop the column `json` on the `parametro` table. All the data in the column will be lost.
  - You are about to drop the `tipo_alerta` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nome]` on the table `tipo_parametro` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `data_hora` to the `alerta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_estacao` to the `alerta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_regra_alerta` to the `alerta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `texto` to the `alerta` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titulo` to the `alerta` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `data_hora` on the `medida` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."operador" AS ENUM ('MAIOR_QUE', 'MENOR_QUE', 'IGUAL', 'MENOR_IGUAL', 'MAIOR_IGUAL');

-- CreateEnum
CREATE TYPE "public"."gravidade" AS ENUM ('Alta', 'Media', 'Baixa');

-- DropForeignKey
ALTER TABLE "public"."alerta" DROP CONSTRAINT "alerta_id_tipo_alerta_fkey";

-- DropForeignKey
ALTER TABLE "public"."tipo_alerta" DROP CONSTRAINT "tipo_alerta_id_parametro_fkey";

-- AlterTable
ALTER TABLE "public"."alerta" DROP COLUMN "data_criacao",
DROP COLUMN "id_tipo_alerta",
DROP COLUMN "mensagem",
ADD COLUMN     "data_hora" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id_estacao" INTEGER NOT NULL,
ADD COLUMN     "id_regra_alerta" INTEGER NOT NULL,
ADD COLUMN     "texto" TEXT NOT NULL,
ADD COLUMN     "titulo" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "public"."medida" DROP COLUMN "data_hora",
ADD COLUMN     "data_hora" TIMESTAMP(3) NOT NULL;

-- AlterTable
CREATE SEQUENCE "public".parametro_id_parametro_seq;
ALTER TABLE "public"."parametro" DROP COLUMN "json",
ALTER COLUMN "id_parametro" SET DEFAULT nextval('"public".parametro_id_parametro_seq');
ALTER SEQUENCE "public".parametro_id_parametro_seq OWNED BY "public"."parametro"."id_parametro";

-- AlterTable
ALTER TABLE "public"."tipo_parametro" ADD COLUMN     "json_key" VARCHAR(50);

-- AlterTable
ALTER TABLE "public"."usuarios" ADD COLUMN     "ativo" BOOLEAN,
ALTER COLUMN "data_criacao" SET DATA TYPE TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."tipo_alerta";

-- CreateTable
CREATE TABLE "public"."regra_alerta" (
    "id_regra_alerta" SERIAL NOT NULL,
    "id_tipo_parametro" INTEGER NOT NULL,
    "operador" "public"."operador" NOT NULL,
    "valor_limite" DECIMAL(10,2) NOT NULL,
    "gravidade" "public"."gravidade" NOT NULL,

    CONSTRAINT "regra_alerta_pkey" PRIMARY KEY ("id_regra_alerta")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipo_parametro_nome_key" ON "public"."tipo_parametro"("nome");

-- AddForeignKey
ALTER TABLE "public"."alerta" ADD CONSTRAINT "alerta_id_regra_alerta_fkey" FOREIGN KEY ("id_regra_alerta") REFERENCES "public"."regra_alerta"("id_regra_alerta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerta" ADD CONSTRAINT "alerta_id_estacao_fkey" FOREIGN KEY ("id_estacao") REFERENCES "public"."estacao"("id_estacao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."regra_alerta" ADD CONSTRAINT "regra_alerta_id_tipo_parametro_fkey" FOREIGN KEY ("id_tipo_parametro") REFERENCES "public"."tipo_parametro"("id_tipo_parametro") ON DELETE RESTRICT ON UPDATE CASCADE;
