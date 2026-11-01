import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeVisualization, visualizationGroupLabel } from '../src/utils/visualization.ts'
import { visualization } from './fixtures/visualizations.mjs'

test('aceita os quatro formatos publicados e preserva zeros, lacunas e resumos sem inventar medidas', () => {
  for (const type of ['categorias', 'serie_temporal', 'histograma', 'boxplot'])
    assert.deepEqual(decodeVisualization(visualization(type), 5), visualization(type))
  assert.equal(visualizationGroupLabel({}, 'Total'), 'Total')
  assert.equal(visualizationGroupLabel({ categoria: null }, 'Total'), 'Não informado')
  const original = visualization()
  const decoded = decodeVisualization(original, 5)
  decoded.dados.pontos[0].valor = 100
  assert.equal(original.dados.pontos[0].valor, 0)
})
test('não renderiza dados de outra unidade, unidade desconhecida, versão ou status incompatível', () => {
  for (const unit of [null, 1, 0]) assert.equal(decodeVisualization(visualization(), unit), null)
  for (const mutation of [
    (v) => (v.versao_contrato = '2.0'),
    (v) => (v.status = 'ACESSO_NEGADO'),
    (v) => (v.dados.tipo = 'html'),
    (v) => (v.metadados.unidade_id = '5'),
  ]) {
    const v = visualization()
    mutation(v)
    assert.equal(decodeVisualization(v, 5), null)
  }
})
test('rejeita medidas não numéricas, negativas, infinitas e contagens/percentuais inconsistentes', () => {
  for (const value of ['7', undefined, NaN, Infinity, -1]) {
    const v = visualization()
    v.dados.pontos[0].valor = value
    assert.equal(decodeVisualization(v, 5), null)
  }
  const v = visualization()
  v.metadados.unidade_medida = 'percentual'
  v.dados.pontos[1].valor = 101
  assert.equal(decodeVisualization(v, 5), null)
  v.dados.pontos[1].valor = 100
  v.dados.pontos[1].qtd_registros = 1.5
  assert.equal(decodeVisualization(v, 5), null)
})
test('conserva significado da base elegível e rejeita quantidades que excedem a base total', () => {
  const v = visualization()
  v.dados.pontos[0].base_calculo = {
    qtd_registros_total: 2,
    qtd_registros_elegiveis: 0,
    qtd_tempos_negativos_excluidos: 2,
  }
  v.dados.pontos[0].valor = null
  assert.ok(decodeVisualization(v, 5))
  v.dados.pontos[0].valor = 0
  assert.equal(decodeVisualization(v, 5), null)
  v.dados.pontos[0].base_calculo.qtd_registros_elegiveis = 3
  assert.equal(decodeVisualization(v, 5), null)
})
test('histograma exige frequência total correta e intervalos ordenados sem sobreposição', () => {
  const v = visualization('histograma')
  v.dados.qtd_registros = 100
  assert.equal(decodeVisualization(v, 5), null)
  v.dados.qtd_registros = 9
  v.dados.intervalos[1].inferior = 9
  assert.equal(decodeVisualization(v, 5), null)
})
test('boxplot valida quartis, contagens de extremos, grupos pequenos e análise de origem', () => {
  for (const mutation of [
    (v) => (v.dados.grupos[0].q1 = 100),
    (v) => (v.dados.grupos[0].qtd_extremos_omitidos = 2),
    (v) => (v.dados.grupos[0].valores_extremos = [3]),
    (v) => (v.dados.grupos[1].qtd_registros = 5),
    (v) => (v.dados.grupos[2].analise_id = 'VIS-01'),
  ]) {
    const v = visualization('boxplot')
    mutation(v)
    assert.equal(decodeVisualization(v, 5), null)
  }
  const v = visualization('boxplot')
  v.dados.grupos[0].q1 = 3
  v.dados.grupos[0].q3 = 3
  assert.ok(decodeVisualization(v, 5))
})
test('série valida datas, período e duplicação dos mesmos pontos', () => {
  for (const mutation of [
    (v) => (v.dados.pontos[0].data_referencia = '2026-02-30'),
    (v) => (v.dados.pontos[0].data_referencia = '2026-09-01'),
    (v) => v.dados.pontos.push(v.dados.pontos[0]),
    (v) => (v.metadados.granularidade = 'ano'),
  ]) {
    const v = visualization('serie_temporal')
    mutation(v)
    assert.equal(decodeVisualization(v, 5), null)
  }
})
test('limita volume e não aceita payload vazio/cíclico sem quebrar o texto do chat', () => {
  const v = visualization()
  v.dados.pontos = Array.from({ length: 51 }, (_, i) => ({
    grupo: { id: i },
    valor: 1,
    qtd_registros: 1,
  }))
  assert.equal(decodeVisualization(v, 5), null)
  v.dados.pontos = []
  assert.equal(decodeVisualization(v, 5), null)
  v.cycle = v
  assert.equal(decodeVisualization(v, 5), null)
  for (const raw of [null, {}, 'grafico', false]) assert.equal(decodeVisualization(raw, 5), null)
})
