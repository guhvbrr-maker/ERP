-- Adicionar campos de preferências de entrega e prioridade à tabela sale_deliveries
ALTER TABLE sale_deliveries 
ADD COLUMN delivery_preferences jsonb,
ADD COLUMN priority varchar DEFAULT 'normal';

-- Adicionar índice para consulta de prioridade
CREATE INDEX idx_sale_deliveries_priority ON sale_deliveries(priority);

-- Comentários para documentação
COMMENT ON COLUMN sale_deliveries.delivery_preferences IS 'Preferências de entrega do cliente em formato JSON estruturado';
COMMENT ON COLUMN sale_deliveries.priority IS 'Prioridade da entrega: low, normal, high, urgent';