-- Recibos numerados y secuenciales (correlativo inmutable para contabilidad)
-- El número se asigna UNA sola vez, al emitir el recibo, y nunca cambia.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number bigint;

-- Unicidad del correlativo (permite NULL para pagos aún no cobrados)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_receipt_number
  ON payments(receipt_number) WHERE receipt_number IS NOT NULL;

-- Secuencia global de recibos
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq;

-- Asigna un correlativo de forma atómica e idempotente:
--  - Si el pago ya tiene número, lo devuelve sin tocarlo (inmutable).
--  - Si no, toma el siguiente de la secuencia bajo lock de fila (sin huecos en este camino).
CREATE OR REPLACE FUNCTION assign_receipt_number(p_payment_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_number bigint;
BEGIN
  SELECT receipt_number INTO v_number FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF v_number IS NOT NULL THEN
    RETURN v_number;
  END IF;
  v_number := nextval('receipt_number_seq');
  UPDATE payments SET receipt_number = v_number WHERE id = p_payment_id;
  RETURN v_number;
END;
$$;

GRANT EXECUTE ON FUNCTION assign_receipt_number(uuid) TO authenticated;
