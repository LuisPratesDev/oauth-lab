-- 0002_adiciona_coluna.sql
-- Guarda o instante do último uso da sessão, permitindo expirar sessões
-- inativas sem depender apenas do prazo fixo de 8 horas do cookie.
--
-- A primeira versão deste arquivo foi enviada com "ALTER TABEL" (erro de
-- sintaxe proposital) para gerar o PR bloqueado da Tarefa 2; o commit
-- seguinte corrigiu a sintaxe e liberou o PR. O merge na main dispara o
-- workflow "migrar", que aplica a coluna no D1 remoto.

ALTER TABLE sessions ADD COLUMN last_seen_at INTEGER;
