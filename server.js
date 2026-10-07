import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Inicializa a IA com a sua chave do .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  try {
    const { mensagem } = req.body;
    
    // Lê o estoque atualizado
    const estoqueRaw = fs.readFileSync(path.resolve('estoque.json'), 'utf8');
    const dadosEstoque = JSON.parse(estoqueRaw);

    const systemInstruction = `
      Você é o atendente virtual amigável da "Mercearia da Esquina".
      Responda de forma direta, prestativa e natural em português do Brasil.
      Use estritamente os dados abaixo para responder sobre produtos, preços, quantidades, endereço e horário de funcionamento. 
      Se o cliente perguntar por algo que não tem no estoque, avise educadamente que não trabalhamos com o item ou que está em falta.

      DADOS DA LOJA E ESTOQUE:
      ${JSON.stringify(dadosEstoque, null, 2)}
    `;

    // Configura o modelo
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.8-flash',
      systemInstruction: systemInstruction 
    });

    // Envia a mensagem do usuário para a IA
    const result = await model.generateContent(mensagem);
    
    res.json({ resposta: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ resposta: "Desculpe, tive um problema ao consultar o sistema da vendinha." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});