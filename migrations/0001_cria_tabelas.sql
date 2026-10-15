-- 0001_cria_tabelas.sql
-- Cria as tabelas usadas pelo fluxo OAuth do site: as transações de login
-- (PKCE, state e nonce) e as sessões locais guardadas apenas como hash.
--
-- ATENÇÃO: o commit que introduz este arquivo tem um erro de sintaxe
-- PROPOSITAL (falta o ");" que fecha a primeira tabela). Ele existe para
-- gerar a execução vermelha pedida na Tarefa 1 da avaliação; o commit
-- seguinte ("fix(ci): corrige a sintaxe da migracao 0001") conserta.

CREATE TABLE IF NOT EXISTS oauth_transactions (
    id_hash TEXT PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'github')),
    state_hash TEXT NOT NULL,
    nonce TEXT,
    code_verifier TEXT NOT NULL,
    expires_at INTEGER NOT NULL

CREATE INDEX IF NOT EXISTS oauth_transactions_expiry
    ON oauth_transactions (expires_at);

CREATE TABLE IF NOT EXISTS sessions (
    id_hash TEXT PRIMARY KEY,
    issuer TEXT NOT NULL,
    subject TEXT NOT NULL,
    email TEXT,
    display_name TEXT,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expiry
    ON sessions (expires_at);
