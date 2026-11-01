import type { ApiUnit } from '../types/api/units'
import type { Address } from '../types/management'
export function address(unit?: ApiUnit): Address {
  return {
    postalCode: unit?.cep ?? '',
    address: unit?.logradouro ?? '',
    district: unit?.bairro ?? '',
    city: unit?.cidade ?? '',
    state: unit?.estado ?? '',
    number: unit?.numero ?? '',
    complement: unit?.complemento ?? '',
  }
}
