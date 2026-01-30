const btn = document.querySelector('#btn-speak');
const output = document.querySelector('#output-text');
const statusDiv = document.querySelector('#status');
const areaLegenda = document.querySelector('.subtitle-area');
const outputText = document.querySelector('#output-text');

// Sempre que o texto mudar:
outputText.innerText = "Legenda aqui -->";
areaLegenda.scrollTop = areaLegenda.scrollHeight; // Isso faz o scroll descer automaticamente
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    statusDiv.innerText = "Seu navegador não suporta reconhecimento de voz.";
    btn.disabled = true;
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.continuous = false;

    btn.addEventListener('click', () => {
        window.speechSynthesis.cancel();
        recognition.start();
        statusDiv.innerText = "🎙️ Ouvindo...";
        output.innerText = "";
        btn.disabled = true;
    });

    recognition.onresult = async (event) => {
        const userText = event.results[0][0].transcript;

        output.innerText = "Você: " + userText;
        statusDiv.innerText = "🤖 Pensando...";

        try {
            const response = await fetch("http://127.0.0.1:3000/perguntar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ texto: userText })
            });

            const data = await response.json();
            // CORREÇÃO: Removendo caracteres especiais (Markdown) que a voz tentaria ler
            const aiText = (data.resposta || "Desculpa, não consegui responder.").replace(/[*#_]/g, "");

            output.innerText = "IA: " + aiText;
            falarTexto(aiText);

        } catch (err) {
            console.error(err);
            output.innerText = "IA: Erro ao falar com o servidor.";
            falarTexto("Houve um erro ao processar sua solicitação.");
            btn.disabled = false; // Garante que o botão volte em caso de erro
        }
    };

    recognition.onend = () => {
        // CORREÇÃO: Só libera o botão se a IA NÃO estiver pensando ou falando
        // Removido o btn.disabled = false daqui para evitar cliques duplos durante o processamento
        if (statusDiv.innerText === "🎙️ Ouvindo...") {
            statusDiv.innerText = "Aguardando resposta...";
        }
    };

    recognition.onerror = (e) => {
        btn.disabled = false;
        statusDiv.innerText = "Erro no microfone: " + e.error;
    };
}

function falarTexto(texto) {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // CORREÇÃO: Cancelar qualquer fala pendente antes de começar a nova
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1.2;
    utterance.volume = 1;

    const escolherVoz = () => {
        const voices = synth.getVoices();
        const vozFeminina = voices.find(v =>
            v.lang.includes("pt-BR") &&
            (v.name.includes("Google") || v.name.includes("Female") || v.name.includes("Maria"))
        ) || voices.find(v => v.lang.includes("pt-BR"));

        if (vozFeminina) {
            utterance.voice = vozFeminina;
        }
    };

    if (synth.getVoices().length) {
        escolherVoz();
    } else {
        synth.onvoiceschanged = escolherVoz;
    }

    // CORREÇÃO: Garante que o status mude e o botão trave durante a fala
    utterance.onstart = () => {
        statusDiv.innerText = "📣 IA Falando...";
        btn.disabled = true;
    };

    utterance.onend = () => {
        statusDiv.innerText = "Pronto. Clique para falar.";
        btn.disabled = false;
    };

    synth.speak(utterance);


}