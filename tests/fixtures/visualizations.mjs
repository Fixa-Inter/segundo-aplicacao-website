export const meta = {
  analise_id: 'VIS-09',
  unidade_id: 5,
  unidade_medida: 'quantidade',
  periodo: { inicio: '2026-06-01', fim: '2026-09-01' },
  granularidade: 'mes',
  consultado_em: '2026-10-31T16:00:00-03:00',
  filtros: {},
  qtd_registros_considerados: 9,
}
export function visualization(tipo = 'categorias') {
  const v = {
    versao_contrato: '1.0',
    visualizacao_id: 'qa-visualizacao',
    titulo: 'Solicitações da unidade',
    status: 'SUCESSO',
    metadados: structuredClone(meta),
    avisos: [],
    dados: {
      tipo,
      pontos: [
        { grupo: { categoria: 'Elétrica' }, valor: 0, qtd_registros: 0 },
        { grupo: { categoria: 'Hidráulica' }, valor: 9, qtd_registros: 9 },
      ],
    },
  }
  if (tipo === 'serie_temporal')
    v.dados = {
      tipo,
      pontos: ['2026-06-01', '2026-07-01', '2026-08-01'].map((data_referencia, i) => ({
        grupo: {},
        data_referencia,
        valor: [0, null, 9][i],
        qtd_registros: [0, 0, 9][i],
      })),
    }
  if (tipo === 'histograma') {
    v.metadados.unidade_medida = 'minutos'
    v.dados = {
      tipo,
      qtd_registros: 9,
      intervalos: [
        { inferior: 0, superior: 10, frequencia: 4, inclui_superior: false },
        { inferior: 10, superior: 20, frequencia: 5, inclui_superior: true },
      ],
    }
  }
  if (tipo === 'boxplot') {
    v.metadados.unidade_medida = 'minutos'
    v.dados = {
      tipo,
      grupos: [
        {
          tipo: 'boxplot',
          analise_id: 'VIS-09',
          grupo: { categoria: 'Elétrica' },
          unidade: 'minutos',
          qtd_registros: 5,
          minimo: 0,
          q1: 2,
          mediana: 3,
          q3: 4,
          maximo: 9,
          limite_inferior: -1,
          limite_superior: 7,
          bigode_inferior: 0,
          bigode_superior: 5,
          valores_extremos: [9],
          qtd_extremos_total: 1,
          qtd_extremos_omitidos: 0,
        },
        {
          tipo: 'resumo',
          analise_id: 'VIS-09',
          grupo: { categoria: 'Hidráulica' },
          unidade: 'minutos',
          qtd_registros: 4,
          minimo: 2,
          maximo: 8,
          media: 5,
          mediana: 5,
          motivo: 'POUCOS_REGISTROS_PARA_BOXPLOT',
        },
        {
          tipo: 'sem_base',
          analise_id: 'VIS-09',
          grupo: { categoria: 'Mecânica' },
          unidade: 'minutos',
          qtd_registros: 0,
          motivo: 'SEM_OBSERVACOES_ELEGIVEIS',
          base_calculo: {
            qtd_registros_total: 2,
            qtd_registros_elegiveis: 0,
            qtd_tempos_negativos_excluidos: 2,
          },
        },
      ],
    }
  }
  return v
}
