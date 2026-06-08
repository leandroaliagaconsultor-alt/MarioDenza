// Aviso de aumento al inquilino. previousRent/newRent ya vienen formateados con su moneda.
export function adjustmentMessage(params: {
  tenantName: string;
  propertyAddress: string;
  previousRent: string;
  newRent: string;
  effectiveDate: string;
}): string {
  return `Hola ${params.tenantName}, te informamos que a partir del ${params.effectiveDate} el alquiler de ${params.propertyAddress} se actualiza de ${params.previousRent} a ${params.newRent}. Cualquier consulta estamos a disposicion. Saludos.`;
}

export function overduePaymentMessage(params: {
  tenantName: string;
  propertyAddress: string;
  period: string;
  amount: string;
  currency: string;
  dueDate: string;
}): string {
  return `Hola ${params.tenantName}, te recordamos que el pago del alquiler de ${params.propertyAddress} correspondiente al periodo ${params.period} por ${params.currency} ${params.amount} vencio el ${params.dueDate}. Te pedimos regularizar la situacion a la brevedad. Saludos.`;
}

export function contractExpirationMessage(params: {
  tenantName: string;
  propertyAddress: string;
  endDate: string;
}): string {
  return `Hola ${params.tenantName}, te recordamos que el contrato de alquiler de ${params.propertyAddress} vence el ${params.endDate}. Nos gustaria coordinar la renovacion o la entrega del inmueble. Saludos.`;
}

export function ownerExpirationMessage(params: {
  ownerName: string;
  tenantName: string;
  propertyAddress: string;
  endDate: string;
}): string {
  return `Hola ${params.ownerName}, le informamos que el contrato de alquiler de su propiedad en ${params.propertyAddress} (inquilino: ${params.tenantName}) vence el ${params.endDate}. Quedamos a disposicion para coordinar la renovacion o los pasos a seguir. Saludos.`;
}

// Aviso al propietario de un aumento aplicado. previousRent/newRent ya vienen formateados con su moneda.
export function ownerAdjustmentMessage(params: {
  ownerName: string;
  tenantName: string;
  propertyAddress: string;
  previousRent: string;
  newRent: string;
  effectiveDate: string;
}): string {
  return `Hola ${params.ownerName}, le informamos que el alquiler de su propiedad en ${params.propertyAddress} (inquilino: ${params.tenantName}) se actualiza de ${params.previousRent} a ${params.newRent} a partir del ${params.effectiveDate}. Saludos.`;
}

// Desglose de liquidación al propietario. lines.amount y total ya vienen formateados con su moneda.
export function ownerPayoutMessage(params: {
  ownerName: string;
  period: string;
  lines: { address: string; amount: string }[];
  total: string;
}): string {
  const detail = params.lines.map((l) => `• ${l.address}: ${l.amount}`).join("\n");
  return `Hola ${params.ownerName}, le pasamos el detalle de la liquidacion del periodo ${params.period}:\n${detail}\nTotal a cobrar: ${params.total}. Cuando guste puede pasar a retirarlo. Saludos.`;
}
