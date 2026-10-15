-- 0001_cria_tabelas.sql
-- Cria as tabelas usadas pelo fluxo OAuth do site: as transações de login
-- (PKCE, state e nonce) e as sessões locais guardadas apenas como hash.
--
-- A primeira versão deste arquivo foi enviada com um erro de sintaxe
-- proposital (sem o ");" da primeira tabela), o que gerou a execução
-- vermelha da Tarefa 1; o commit seguinte corrigiu e deixou a execução
-- verde. Como o esquema abaixo já existe no D1 remoto, os IF NOT EXISTS
-- mantêm a migração idempotente ao chegar lá.

CREATE TABLE IF NOT EXISTS oauth_transactions (
    id_hash TEXT PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'github')),
    state_hash TEXT NOT NULL,
    nonce TEXT,
    code_verifier TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);

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
