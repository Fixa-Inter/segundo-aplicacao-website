import NEUTRO from './manu-emotions/NEUTRO.png'
import CURIOSO from './manu-emotions/CURIOSO.png'
import PENSATIVO from './manu-emotions/PENSATIVO.png'
import CONFIRMACAO from './manu-emotions/CONFIRMACAO.png'
import SUCESSO from './manu-emotions/SUCESSO.png'
import EMPATICO from './manu-emotions/EMPATICO.png'
import ALERTA from './manu-emotions/ALERTA.png'
import ERRO from './manu-emotions/ERRO.png'
import BLOQUEADO from './manu-emotions/BLOQUEADO.png'
import CONSELHEIRO from './manu-emotions/CONSELHEIRO.png'
import AGUARDANDO from './manu-emotions/AGUARDANDO.png'
import CELEBRACAO from './manu-emotions/CELEBRACAO.png'
import { normalizeManuEmotion } from '../utils/manu'
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
