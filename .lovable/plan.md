

## Sistema de Controle de Produtos

### Visão Geral
Sistema web focado em eficiência para registro de contagem de produtos. Interface minimalista centrada na busca, com fluxo rápido de seleção → quantidade → registro.

---

### 1. Configuração do Backend (Supabase)
Criar duas tabelas no Supabase:

**Tabela de Referência (`produtos_referencia`)**
- Campos: REFFORN, CODPROD (chave), COMPLDESC, DESCRPROD, MARCA
- Será populada manualmente pelo painel do Supabase
- Busca em tempo real em todos os 5 campos

**Tabela de Registros (`produtos_inseridos`)**
- Campos: id (auto), CODPROD, QTD, DTINSERT (automático), NOVO ("S" ou "N"), DESCRPROD (para produtos novos)
- Permite múltiplas inserções do mesmo CODPROD (histórico)

**Sequência para CODPROD de produtos novos**
- Geração automática numérica sequencial (ex: 90001, 90002...)

---

### 2. Tela Principal — Campo de Busca
- Interface limpa com apenas o campo de busca centralizado e o botão "NOVO PRODUTO"
- Design responsivo, otimizado para celulares
- Sem menus de navegação ou abas extras

---

### 3. Busca em Tempo Real
- Busca automática conforme o usuário digita (debounce para performance)
- Pesquisa simultânea em REFFORN, CODPROD, COMPLDESC, DESCRPROD e MARCA
- Exibe no máximo **5 sugestões** no dropdown
- Cada sugestão mostra: **REFFORN + MARCA + DESCRPROD**
- Ao clicar na sugestão, abre o popup de quantidade

---

### 4. Popup de Quantidade
- Modal centralizado (≈1/3 da tela) com foco automático no campo
- Aceita apenas valores numéricos (validação obrigatória)
- Confirma com Enter ou botão
- Após registro bem-sucedido: toast verde de confirmação → fecha modal → volta à busca
- Em caso de erro: exibe mensagem clara, não fecha o modal

---

### 5. Fluxo "NOVO PRODUTO"
- Botão fixo e visível na interface
- Passo 1: popup com campo DESCRPROD (descrição do produto)
- Passo 2: popup de quantidade (mesmo comportamento do fluxo principal)
- Registro com flag NOVO = "S" e CODPROD gerado automaticamente (sequencial numérico)

---

### 6. Feedback e Tratamento de Erros
- Toast verde no canto superior direito para sucesso
- Mensagem de erro clara caso a inserção no Supabase falhe
- Sistema não avança para próximo produto em caso de falha

