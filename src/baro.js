import axios from 'axios'

// Cliente HTTP configurado com o endereço e a chave da Barô (lidos do .env)
const baro = axios.create({
    baseURL: import.meta.env.VITE_BARO_URL,
    headers: { Authorization: `Bearer ${import.meta.env.VITE_BARO_KEY}` },
    timeout: 60000, // 60 s: a análise de imagem pode demorar
})

// Pergunta enviada junto com cada imagem
export const PERGUNTA = `Você é o piloto de um carro autônomo. A imagem mostra uma pista vista
,→ de cima;
 o carro vermelho está embaixo e anda para cima. Se o carro seguir reto, ele bate?
 Qual a melhor ação: SEGUIR, ESQUERDA, DIREITA ou FREAR?
 Responda SOMENTE com JSON: {"bate": true ou false, "acao": "...", "motivo": "frase curta"}`

// Converte um arquivo da pasta public (ex.: /pistas/cena1.png) em data URL base64
async function paraBase64(caminho) {
    const { data } = await axios.get(caminho, { responseType: 'blob' })
    return new Promise((resolve) => {
        const leitor = new FileReader()
        leitor.onload = () => resolve(leitor.result) // "data:image/png;base64,..."
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
    const json = texto.match(/\{[\s\S]*\}/) // ignora ```json ... ``` em volta
    return JSON.parse(json ? json[0] : texto)
}