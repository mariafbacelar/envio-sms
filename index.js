const axios = require('axios');
const fs = require('fs').promises;
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Controle para evitar envios duplicados
let ultimoEnvio = null;
let ultimoTeste = null;

// Função de data/hora
function obterDataHoraFormatada() {
    const agora = new Date();

    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();

    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    const segundo = String(agora.getSeconds()).padStart(2, '0');

    return `${dia}/${mes}/${ano}-${hora}:${minuto}:${segundo}`;
}

// Função de envio
async function enviarSms(tipo = "NORMAL") {
    const dataHora = obterDataHoraFormatada();
    const mensagemFormatada = `${tipo} [${dataHora}]`;

    const url = 'http://sms.painelmarktel.com.br/index.php';

    const params = {
        app: 'api',
        o: 'enviar',
        u: process.env.MARKTEL_LOGIN,
        p: process.env.MARKTEL_SENHA,
        f: process.env.NUMERO_BFPRI,
        m: mensagemFormatada
    };

    try {
        console.log(`[${dataHora}] Enviando SMS (${tipo})...`);
        const response = await axios.get(url, { params });

        const retorno = response.data;

        const log = `Tipo: ${tipo}\nMensagem: ${mensagemFormatada}\nData: ${dataHora}\nRetorno: ${retorno}\n----------------------\n`;
        await fs.appendFile('historico_envios.txt', log);

    } catch (error) {
        const erro = `Tipo: ${tipo}\nMensagem: ${mensagemFormatada}\nData: ${dataHora}\nERRO: ${error.message}\n----------------------\n`;
        await fs.appendFile('historico_envios.txt', erro);
    }
}

// 🧠 Loop inteligente (sem cron)
setInterval(async () => 
    {
const agora = new Date();

const hora = Number(
    agora.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        hour12: false
    })
);

const minuto = Number(
    agora.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        minute: "2-digit"
    })
);

console.log("Hora Brasil:", hora, "Minuto:", minuto);

    const chaveEnvio = `${hora}:${minuto}`;
    const chaveTeste = `${hora}:${minuto}`;

    // 🔁 ENVIO NORMAL: 00:00 até 06:45 a cada 15 min
    const dentroJanela =
        (hora >= 0 && hora < 6) || (hora === 6 && minuto <= 45);

    const minutoValido = minuto % 15 === 0;

    if (dentroJanela && minutoValido) {
        if (ultimoEnvio !== chaveEnvio) {
            ultimoEnvio = chaveEnvio;
            await enviarSms("NORMAL");
        }
    }

    // 🧪 TESTE: 20:35 (apenas uma vez)
    if (hora === 20 && minuto === 35) {
        if (ultimoTeste !== chaveTeste) {
            ultimoTeste = chaveTeste;
            await enviarSms("TESTE");
        }
    }

}, 60 * 1000); // roda a cada 1 minuto

// Endpoint manual (opcional)
app.get('/enviar', async (req, res) => {
    await enviarSms("MANUAL");
    res.send('Enviado manualmente');
});

app.get('/', (req, res) => {
    res.send('API rodando 🚀');
});

app.listen(PORT, () => {
    console.log('Aplicação iniciada com sucesso!');
});