import { useState } from 'react'
import { analisarImagem, PERGUNTA } from './baro'
import './App.css'

// Lista de PNGs salvos na pasta public/pistas
const IMAGENS = [
  '/pistas/cena1.png',
  '/pistas/cena2.png',
  '/pistas/cena3.png',
  '/pistas/cena4.png',
]

export default function App() {
  const [atual, setAtual] = useState(0)
  const [executando, setExecutando] = useState(false)
  const [resultados, setResultados] = useState({})

  async function executar() {
    setExecutando(true)
    setResultados({})

    for (let i = 0; i < IMAGENS.length; i++) {
      setAtual(i) // destaca a pista que está sendo analisada
      const inicio = performance.now()
      try {
        const r = await analisarImagem(IMAGENS[i]) // { bate, acao, motivo }
        const tempo = Math.round(performance.now() - inicio)
        setResultados((ant) => ({ ...ant, [i]: { ...r, tempo } }))
      } catch (erro) {
        const tempo = Math.round(performance.now() - inicio)
        setResultados((ant) => ({
          ...ant,
          [i]: { erro: erro.message, tempo },
        }))
      }
    }

    setExecutando(false)
  }

  // Cálculo para o card de "Situação"
  const listaResultados = Object.values(resultados).filter((r) => !r.erro)
  const totalAnalisadas = listaResultados.length
  const totalBateriam = listaResultados.filter((r) => r.bate).length
  const temColisao = totalBateriam > 0

  return (
    <div className="pagina">
      {/* Cabeçalho */}
      <header className="cabecalho">
        <h1>Pista Autônoma</h1>
        <p>A Barô olha cada pista e decide o que o carrinho deve fazer</p>
      </header>

      <main className="container">
        {/* Linha 1: Pista Atual + Status da Barô */}
        <div className="linha-topo">
          <section className="card card-pista-atual">
            <span className="titulo-secao">PISTA {atual + 1}</span>
            <div className="moldura-pista-grande">
              <img
                src={IMAGENS[atual]}
                alt={`Pista ${atual + 1}`}
                className="imagem-pista-grande"
              />
            </div>
          </section>

          <section className="card card-baro">
            <div className="baro-info">
              <div className="baro-logo-texto">
                <span className="icone-trem">🚂</span>
                <div>
                  <h2>Barô</h2>
                  <small>a IA da Mauá</small>
                </div>
              </div>
              <p className="modelo-nome">
                {import.meta.env.VITE_BARO_MODEL || 'google/gemma-3-27b'}
              </p>
              <div className={`status-badge ${executando ? 'analisando' : 'pronta'}`}>
                <span className="bolinha"></span>
                {executando ? 'analisando...' : 'pronta'}
              </div>
            </div>
          </section>
        </div>

        {/* Linha 2: Miniaturas das Pistas + Pergunta enviada */}
        <div className="linha-meio">
          <section className="card">
            <span className="titulo-secao">PISTAS</span>
            <div className="grade-miniaturas">
              {IMAGENS.map((src, i) => (
                <button
                  key={src}
                  className={`btn-miniatura ${atual === i ? 'selecionada' : ''}`}
                  onClick={() => setAtual(i)}
                  disabled={executando}
                >
                  <img src={src} alt={`Miniatura Pista ${i + 1}`} />
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <span className="titulo-secao">PERGUNTA ENVIADA À BARÔ</span>
            <pre className="caixa-pergunta">{PERGUNTA}</pre>
          </section>
        </div>

        {/* Botão Executar centralizado */}
        <div className="area-executar">
          <button
            className="btn-executar"
            onClick={executar}
            disabled={executando}
          >
            {executando ? '⏳ Executando...' : '▶ Executar'}
          </button>
        </div>

        {/* Linha 3: Situação Geral + Resultado de cada pista */}
        <div className="linha-base">
          <section className="card card-situacao">
            {totalAnalisadas === 0 ? (
              <div className="situacao-vazia">
                <div className="circulo-icone neutro">?</div>
                <p>Clique em Executar para analisar as pistas</p>
              </div>
            ) : (
              <div className="situacao-preenchida">
                <div className={`circulo-icone ${temColisao ? 'perigo' : 'seguro'}`}>
                  {temColisao ? '✕' : '✓'}
                </div>
                <p>
                  <strong>
                    {totalBateriam} de {totalAnalisadas} bateriam seguindo reto
                  </strong>
                </p>
              </div>
            )}
          </section>

          <section className="card card-resultados">
            <span className="titulo-secao">RESULTADO DE CADA PISTA</span>
            <div className="lista-resultados">
              {IMAGENS.map((src, i) => {
                const res = resultados[i]
                return (
                  <div key={src} className="linha-resultado">
                    <div className="col-pista">
                      <img src={src} alt={`Pista ${i + 1}`} className="mini-thumb" />
                      <strong>Pista {i + 1}</strong>
                    </div>

                    {!res ? (
                      <span className="texto-aguardando">
                        {executando && atual === i ? 'Analisando pista...' : 'Aguardando...'}
                      </span>
                    ) : res.erro ? (
                      <span className="texto-erro">Erro: {res.erro}</span>
                    ) : (
                      <>
                        <div className="col-badges">
                          <span className={`badge ${res.bate ? 'badge-bate' : 'badge-nao-bate'}`}>
                            {res.bate ? 'BATE' : 'NÃO BATE'}
                          </span>
                          <span className="badge badge-acao">{res.acao}</span>
                        </div>
                        <span className="col-motivo">{res.motivo}</span>
                        <span className="col-tempo">{res.tempo} ms</span>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}