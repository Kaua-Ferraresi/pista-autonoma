import axios from 'axios'

// Cliente HTTP configurado com o endereço e a chave da Barô (lidos do .env)
const baro = axios.create({
    baseURL: import.meta.env.VITE_BARO_URL,
    headers: { Authorization: `Bearer ${import.meta.env.VITE_BARO_KEY}` },
    timeout: 60000, // 60 s: a análise de imagem pode demorar
})

// Pergunta enviada junto com cada imagem
export const PERGUNTA = `Analise a pista de cima a baixo. A pista tem 3 faixas (esquerda, centro e direita) e o carro vermelho está na faixa central.
Identifique todos os obstáculos: cones laranjas e caixas de madeira marrons.

Decida a ação do carro seguindo esta ordem de prioridade:
1. Se a faixa central estiver livre à frente, siga "reto".
2. Se houver obstáculo na faixa central, mude para uma faixa lateral livre ("esquerda" ou "direita"). Priorize desviar para a faixa com mais espaço livre à frente.
3. Pare ("parar") APENAS se todas as três faixas (esquerda, centro e direita) estiverem bloqueadas ao mesmo tempo.

Responda SOMENTE com um objeto JSON válido, sem markdown ou texto extra:
{"bate": false, "acao": "reto | esquerda | direita | parar", "motivo": "frase curta explicando o estado das faixas"}`

// Converte um arquivo da pasta public (ex.: /pistas/cena1.png) em data URL base64
async function paraBase64(caminho) {
    const { data } = await axios.get(caminho, { responseType: 'blob' })
    return new Promise((resolve) => {
        const leitor = new FileReader()
        leitor.onload = () => resolve(leitor.result) 
        leitor.readAsDataURL(data)
    })
}

// Envia uma imagem para a Barô e devolve { bate, acao, motivo }
export async function analisarImagem(caminho) {
    const imagem = await paraBase64(caminho)
    const resposta = await baro.post('/chat/completions', {
        model: import.meta.env.VITE_BARO_MODEL,
        temperature: 0,
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: PERGUNTA },
                    { type: 'image_url', image_url: { url: imagem } },
                ],
            },
        ],
    })
    const texto = resposta.data.choices[0].message.content
    const json = texto.match(/\{[\s\S]*\}/) 
    return JSON.parse(json ? json[0] : texto)
}