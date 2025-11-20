
import { gerarRelatorioUsuario } from "../services/RelatorioService.js";

export const enviarRelatorioMensal = async (req, res) => {
  const { id } = req.params;

  try {

    if (!id) {
      return res.status(400).json({ error: "ID do usuário é obrigatório." });
    }


    const resultado = await gerarRelatorioUsuario(Number(id));


    res.status(200).json(resultado);

  } catch (err) {

    if (err.message.includes("não encontrado")) {
      return res.status(404).json({ error: err.message });
    }


    res.status(500).json({ error: err.message });
  }
};