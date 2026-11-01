import { normalizeManuEmotion } from '../utils/manu'
import AGUARDANDO from './manu-emotions/AGUARDANDO.png'
import ALERTA from './manu-emotions/ALERTA.png'
import BLOQUEADO from './manu-emotions/BLOQUEADO.png'
import CELEBRACAO from './manu-emotions/CELEBRACAO.png'
import CONFIRMACAO from './manu-emotions/CONFIRMACAO.png'
import CONSELHEIRO from './manu-emotions/CONSELHEIRO.png'
import CURIOSO from './manu-emotions/CURIOSO.png'
import EMPATICO from './manu-emotions/EMPATICO.png'
import ERRO from './manu-emotions/ERRO.png'
import NEUTRO from './manu-emotions/NEUTRO.png'
import PENSATIVO from './manu-emotions/PENSATIVO.png'
import SUCESSO from './manu-emotions/SUCESSO.png'

const images = {
  NEUTRO,
  CURIOSO,
  PENSATIVO,
  CONFIRMACAO,
  SUCESSO,
  EMPATICO,
  ALERTA,
  ERRO,
  BLOQUEADO,
  CONSELHEIRO,
  AGUARDANDO,
  CELEBRACAO,
}
export const manuEmotionImage = (emotion: unknown) => images[normalizeManuEmotion(emotion)]
