-- 0002_adiciona_coluna.sql
-- Guarda o instante do último uso da sessão, permitindo expirar sessões
-- inativas sem depender apenas do prazo fixo de 8 horas do cookie.
--
-- ATENÇÃO: este commit tem um erro de sintaxe PROPOSITAL ("ALTER TABEL"),
-- usado como evidência do PR bloqueado da Tarefa 2; o commit seguinte
-- ("fix(migracao-d1): ...") corrige e libera o PR.

ALTER TABEL sessions ADD COLUMN last_seen_at INTEGER;
