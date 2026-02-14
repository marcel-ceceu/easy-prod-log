

## Melhoria de Foco para Cameras Menos Potentes

### Problema

Em celulares com cameras de menor qualidade, o `focusMode: "continuous"` passado nas constraints iniciais nem sempre e respeitado pelo navegador. Isso faz a imagem ficar embaçada e o ZXing nao conseguir decodificar. Alem disso, a resolucao de 1920x1080 pode ser alta demais para cameras fracas, fazendo o navegador entregar um stream de baixa qualidade ou com upscale artificial.

### Solucao

Todas as mudancas em `src/components/BarcodeScannerSheet.tsx`.

**1. Aplicar constraints avancadas apos o stream iniciar (applyConstraints)**

Apos o video comecar a rodar, acessar o `MediaStreamTrack` do video e usar `applyConstraints()` para forcar:
- `focusMode: "continuous"` (redundancia intencional -- funciona melhor pos-stream)
- `zoom: 2.0` (zoom digital leve para aproximar o codigo, muito eficaz em cameras fracas)

Isso sera feito com um `useEffect` que observa o `ref` do video e chama `applyConstraints` na track assim que o stream estiver ativo.

**2. Reduzir resolucao ideal com fallback inteligente**

Trocar a resolucao de `1920x1080` para `1280x720` como ideal. Cameras fracas tentam entregar 1080p e falham, resultando em frames borrados. 720p e mais realista e ainda suficiente para decodificar codigos de barras lineares.

**3. Adicionar focusDistance como hint**

Na chamada `applyConstraints`, incluir `focusDistance` com valor baixo (ex: 0.15 a 0.25 metros) como `ideal`, orientando a camera a focar em objetos proximos -- que e exatamente o caso de leitura de codigo de barras.

**4. Re-trigger de foco periodico**

Implementar um intervalo (`setInterval` a cada 2 segundos) que alterna o `focusMode` entre `"manual"` e `"continuous"`. Esse "kick" forca cameras que param de focar a reiniciar o auto-foco. E a tecnica mais eficaz para cameras que "travam" o foco.

**5. Fallback de resolucao nas constraints iniciais**

Usar o campo `advanced` das MediaStreamConstraints para tentar 1080p primeiro, mas aceitar 720p ou ate 640x480 como fallback, evitando que o getUserMedia falhe ou entregue um stream ruim.

### Secao Tecnica

Estrutura do `useEffect` pos-stream:

```typescript
useEffect(() => {
  const video = ref.current;
  if (!video) return;

  const applyFocusConstraints = () => {
    const stream = video.srcObject as MediaStream;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities?.();

    // Aplica focusMode + focusDistance + zoom se suportados
    const advanced: any = {};
    if (capabilities?.focusMode?.includes("continuous")) {
      advanced.focusMode = "continuous";
    }
    if (capabilities?.focusDistance) {
      advanced.focusDistance = capabilities.focusDistance.min + 0.1;
    }
    if (capabilities?.zoom) {
      advanced.zoom = Math.min(2.0, capabilities.zoom.max);
    }

    if (Object.keys(advanced).length > 0) {
      track.applyConstraints({ advanced: [advanced] });
    }
  };

  // Aguarda stream estar pronto
  const timer = setTimeout(applyFocusConstraints, 1000);

  // Re-kick de foco a cada 2s
  const interval = setInterval(() => {
    const stream = video.srcObject as MediaStream;
    const track = stream?.getVideoTracks()[0];
    if (!track) return;
    track.applyConstraints({ advanced: [{ focusMode: "manual" }] })
      .then(() => track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }))
      .catch(() => {});
  }, 2000);

  return () => {
    clearTimeout(timer);
    clearInterval(interval);
  };
}, [ref]);
```

Constraints iniciais com fallback:

```typescript
constraints: {
  video: {
    facingMode: "environment",
    width: { min: 640, ideal: 1280 },
    height: { min: 480, ideal: 720 },
    // @ts-ignore
    focusMode: { ideal: "continuous" },
  },
  audio: false,
}
```

Nenhuma dependencia nova. Tudo usa APIs nativas do navegador (`MediaStreamTrack.applyConstraints`, `getCapabilities`).
