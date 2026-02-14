

## Busca Avancada de Produtos

### Problema Atual
A busca atual pesquisa apenas no campo `refforn` usando `ilike`, sem tratamento de acentuacao.

### Solucao

**1. Migracao no banco de dados**

Habilitar a extensao `unaccent` do PostgreSQL e criar uma funcao RPC `search_produtos` que:
- Recebe um termo de busca como parametro
- Remove acentos do termo e dos campos usando `unaccent()`
- Faz `ILIKE` com `%termo%` em todos os 5 campos: `refforn`, `codprod`, `compldesc`, `descrprod`, `marca`
- Combina os resultados com `OR` (qualquer campo que corresponda)
- Limita a 5 resultados

```sql
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.search_produtos(search_term text)
RETURNS SETOF public.produtos_referencia
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT *
  FROM public.produtos_referencia
  WHERE
    extensions.unaccent(COALESCE(refforn,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
    OR extensions.unaccent(COALESCE(codprod,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
    OR extensions.unaccent(COALESCE(compldesc,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
    OR extensions.unaccent(COALESCE(descrprod,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
    OR extensions.unaccent(COALESCE(marca,'')) ILIKE '%' || extensions.unaccent(search_term) || '%'
  LIMIT 5;
$$;
```

**2. Atualizar o frontend (`src/pages/Contagem.tsx`)**

Substituir a query direta com `ilike` por uma chamada RPC:

```typescript
const { data, error } = await supabase.rpc("search_produtos", {
  search_term: query,
});
```

**3. Atualizar o label da busca**

Trocar "Buscar por REFFORN" para "Buscar produto" ja que agora busca em todos os campos.

---

### Resultado
- Buscar "dch" encontra em qualquer campo, maiusculo ou minusculo
- Buscar "açúcar" encontra "acucar" e vice-versa
- Correspondencia parcial em inicio, meio ou fim do texto

