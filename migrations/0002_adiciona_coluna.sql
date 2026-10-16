-- Coluna para registrar o último uso de uma sessão.
-- Esta tabela já existe na migração 0001_cria_tabelas.sql.
-- ATENÇÃO: aplicar somente uma vez via Wrangler migrations.
ALTER TABLE sessions ADD COLUMN last_seen_at INTEGER;
