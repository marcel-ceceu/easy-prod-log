

## Ajuste de Layout da Home para Mobile

### Problema
A tabela de ultimos lancamentos tem 5 colunas com larguras minimas fixas (`min-w-[100px]`, `min-w-[120px]`, etc.) que somadas ultrapassam a largura de telas de celular, forcando rolagem horizontal.

### Solucao

Transformar a tabela em um layout de **cards empilhados** no mobile, mantendo a tabela no desktop.

**Arquivo: `src/components/RecentEntriesTable.tsx`**

1. Substituir a tabela por cards responsivos para cada entrada:
   - Cada card mostra: label (REFFORN/nome) em destaque, descricao abaixo, e QTD + Data + botoes de acao na mesma linha
   - Usar layout flexbox com `flex-wrap` para que tudo caiba na tela
   - Remover `min-w-*` fixos e a estrutura de tabela HTML

2. Layout de cada card:
   - Linha 1: Label do produto (bold) + badge "Novo" se aplicavel
   - Linha 2: Descricao (truncada)
   - Linha 3: QTD | Data | Botoes editar/excluir (alinhados a direita)

3. Usar `overflow-hidden` no container pai em vez de `overflow-auto`

**Arquivo: `src/pages/Index.tsx`**

4. Adicionar `overflow-x-hidden` no container raiz para garantir que nada vaze horizontalmente

**Arquivo: `src/index.css`**

5. Adicionar regra global `html, body { overflow-x: hidden; }` como seguranca extra

### Secao Tecnica

- Container raiz: trocar `max-w-2xl` por `max-w-lg` para melhor aproveitamento em mobile
- Cada entrada vira um `div` com `border-b` em vez de `TableRow`
- Textos longos usam `truncate` e `break-words` para nunca estourar
- Botoes de acao ficam compactos com `h-7 w-7`
- Nenhuma largura minima fixa sera usada

