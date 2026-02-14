

## Melhoria na Leitura de Codigos de Barras

### Diagnostico

A implementacao atual tem varios pontos fracos:
- Video ocupa o container inteiro sem guias visuais -- usuario nao sabe onde posicionar
- Resolucao de 1280x720 -- pode ser maior
- Intervalo de 500ms entre tentativas -- pode ser mais rapido
- Nenhum hint de decodificacao para a biblioteca ZXing -- nao usa TRY_HARDER
- Sem feedback ao usuario quando o codigo e lido
- Sem opcao de lanterna para ambientes escuros
- A biblioteca `react-zxing` ja expoe `torch` (lanterna) mas nao estamos usando

### Solucao

Tudo concentrado em um unico arquivo: `src/components/BarcodeScannerSheet.tsx`

**1. Overlay com guias visuais retangulares**

Adicionar um overlay absoluto sobre o video com:
- Fundo semi-transparente escuro nas bordas (mascara)
- Recorte retangular horizontal no centro (proporcao ~3:1, largura 80% da tela)
- Cantos estilizados com bordas brancas nos 4 vertices do retangulo
- Linha animada horizontal que percorre verticalmente dentro do recorte (efeito "scanning")
- Texto instrucional abaixo do recorte

**2. Aumentar resolucao e frequencia**

```
constraints: {
  video: {
    facingMode: "environment",
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    focusMode: { ideal: "continuous" },
  },
  audio: false,
}
```

- Resolucao de 1920x1080 (era 1280x720)
- `focusMode: "continuous"` para auto-foco continuo (suportado na maioria dos Android)
- `timeBetweenDecodingAttempts`: reduzir de 500ms para 250ms

**3. Hints de decodificacao ZXing**

Usar `DecodeHintType` para melhorar a taxa de acerto:
- `TRY_HARDER = true` -- algoritmo mais agressivo
- `POSSIBLE_FORMATS` -- limitar aos formatos comuns de codigo de barras linear (EAN_13, EAN_8, CODE_128, CODE_39, UPC_A, UPC_E, ITF) para evitar falsos positivos e acelerar a decodificacao

**4. Botao de lanterna (torch)**

A biblioteca ja retorna `torch.isAvailable` e `torch.on()/off()`. Adicionar um botao no canto do overlay para ligar/desligar a lanterna do celular -- resolve o problema de ambientes escuros.

**5. Feedback de sucesso**

Quando um codigo for lido com sucesso:
- Flash verde rapido no overlay (animacao CSS de 300ms)
- Vibracao haptica via `navigator.vibrate(200)` (suportado em Android, ignorado silenciosamente em iOS)

**6. Area de video retangular**

Mudar o container do video de `flex-1` (ocupa toda a altura) para `aspect-video` (16:9), centralizado. Isso faz o video ter proporcao horizontal natural, alinhado com o formato dos codigos de barras.

### Secao Tecnica

Arquivo editado: `src/components/BarcodeScannerSheet.tsx`

Estrutura do componente `ScannerView` apos as mudancas:

```
<div className="relative aspect-video w-full">
  <video ref={ref} ... />

  {/* Overlay com mascara e recorte */}
  <div className="absolute inset-0">
    {/* Mascara escura com recorte transparente via CSS clip-path */}
    {/* Cantos brancos nos vertices */}
    {/* Linha animada de scan */}
  </div>

  {/* Botao torch no canto superior direito */}
  {torch.isAvailable && (
    <Button onClick={toggle} ...>
      <Flashlight />
    </Button>
  )}

  {/* Flash verde de sucesso (condicional) */}
  {scanned && <div className="absolute inset-0 bg-green-500/30 animate-fade-out" />}
</div>
```

Animacao CSS para a linha de scan e o flash de sucesso serao adicionadas inline ou via classes Tailwind com `@keyframes` no proprio componente.

Nenhuma dependencia nova necessaria -- tudo ja esta disponivel com `react-zxing`, `lucide-react` e Tailwind.
