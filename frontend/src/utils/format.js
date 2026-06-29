export function currency(value = 0) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function dateBR(value) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}
