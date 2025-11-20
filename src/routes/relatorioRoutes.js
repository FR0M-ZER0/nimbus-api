import { Router } from "express";
import { enviarRelatorioMensal } from "../controllers/relatorioController.js";

const router = Router();

router.post("/:id", enviarRelatorioMensal);

export default router;