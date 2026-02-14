# gopush

Atalho para sincronizar o repositório: pull, add, commit e push no GitHub.

## Uso

```bash
npm run gopush
```

Com mensagem de commit personalizada:

```bash
npm run gopush -- "feat: descrição das alterações"
```

## Fluxo

1. **git pull** — Atualiza do remoto
2. **git add .** — Adiciona todas as alterações
3. **git commit** — Grava (usa data se não informar mensagem)
4. **git push** — Envia para o GitHub

## Notas

- Sem mensagem, o commit usa `Update DD/MM/AAAA` automaticamente
- Se não houver alterações para commitar, o passo de commit é ignorado
