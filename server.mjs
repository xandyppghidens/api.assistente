import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

// 1. Carregar as variáveis do arquivo .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Tratamento de erros globais para evitar que o servidor caia
process.on('uncaughtException', (err) => console.error('Erro crítico detectado:', err));
process.on('unhandledRejection', (reason) => console.error('Promessa rejeitada:', reason));

// 2. Sincronização com seu .env (Usando o nome que você definiu)
const API_KEY = process.env.MINHA_CHAVE_FIXA;

// Verificação de segurança no terminal ao iniciar
if (!API_KEY) {
    console.error("❌ ERRO: A variável 'MINHA_CHAVE_FIXA' não foi encontrada no seu arquivo .env!");
} else {
    console.log("✅ Chave API detectada com sucesso.");
}

app.post("/perguntar", async (req, res) => {
    const { texto } = req.body;

    if (!API_KEY) {
        return res.status(500).json({ resposta: "Erro: Servidor sem chave de acesso configurada." });
    }

    console.log("🎤 Texto recebido do site:", texto);

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // 3. Enviando a chave correta para a Groq
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: texto }],
                max_tokens: 400, // Aumentei um pouco para respostas mais completas
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("❌ Erro retornado pela Groq:", data);
            return res.status(response.status).json({ resposta: "A IA encontrou um problema técnico." });
        }

        const resposta = data?.choices?.[0]?.message?.content || "A IA não retornou conteúdo.";
        console.log("🤖 Resposta enviada ao usuário!");
        res.json({ resposta });

    } catch (err) {
        console.error("💥 Erro de conexão com a API:", err.message);
        res.status(500).json({ resposta: "Erro de conexão com o servidor da IA." });
    }
});

// 4. Inicialização do Servidor
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log("-----------------------------------------");
    console.log(`🚀 SERVIDOR ATIVO NA PORTA ${PORT}!`);
    console.log("Mantenha este terminal aberto para o site funcionar.");
    console.log("-----------------------------------------");
});