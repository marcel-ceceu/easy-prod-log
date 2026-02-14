

## Scanner V3 -- Foco Robusto e Decode Otimizado

Todas as mudancas em `src/components/BarcodeScannerSheet.tsx`. Sem dependencias novas.

### 1. Re-kick de foco mais inteligente (substituir manual/continuous toggle)

O re-kick atual alterna focusMode entre manual e continuous a cada 2s. Isso pode causar "piscadas" de desfoque em alguns devices. A nova abordagem:

- Verificar se o track ainda esta `live` antes de qualquer applyConstraints
- Em vez de alternar focusMode, variar levemente o `focusDistance` (delta de +/- 0.05 ao redor do valor base) a cada ciclo. Isso forca a camera a refocar sem trocar o modo.
- Fallback: se focusDistance nao for suportado, ai sim alternar manual/continuous como hoje.
- Adicionar backoff em caso de erro consecutivo (parar de tentar apos 3 falhas seguidas, retomar apos 10s).
- Checar `document.visibilityState` -- pausar o intervalo quando app esta em background.

### 2. Cleanup robusto de timers

- Alem do clearTimeout/clearInterval no return do useEffect, adicionar listener de `visibilitychange` para pausar/retomar o intervalo.
- Verificar `track.readyState === "live"` antes de cada applyConstraints para evitar erros em tracks ja encerradas.

### 3. Exposure e white balance contínuos

No `applyFocusConstraints` (pos-stream), alem de focusMode/focusDistance/zoom, tambem aplicar:
- `exposureMode: "continuous"` (se suportado)
- `whiteBalanceMode: "continuous"` (se suportado)

Isso melhora a leitura em ambientes com iluminacao variavel.

### 4. Decode rate control (timeBetweenDecodingAttempts)

Manter em 250ms (equivale a ~4 fps de decode). O ZXing ja trabalha no frame atual do video, entao nao ha ganho em ir mais rapido -- apenas mais CPU. 250ms e o sweet spot.

### 5. Torch toggle (ja implementado)

Manter como esta -- ja funcional.

---

### Secao Tecnica

**useEffect pos-stream reescrito:**

```typescript
useEffect(() => {
  const video = ref.current;
  if (!video) return;

  let errorCount = 0;
  let focusDistanceBase = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let backoffId: ReturnType<typeof setTimeout> | null = null;

  const getTrack = () => {
    const stream = video.srcObject as MediaStream;
    const track = stream?.getVideoTracks()[0];
    return track?.readyState === "live" ? track : null;
  };

  const applyInitialConstraints = () => {
    const track = getTrack();
    if (!track) return;

    const caps = (track as any).getCapabilities?.();
    const advanced: any = {};

    if (caps?.focusMode?.includes("continuous")) {
      advanced.focusMode = "continuous";
    }
    if (caps?.exposureMode?.includes("continuous")) {
      advanced.exposureMode = "continuous";
    }
    if (caps?.whiteBalanceMode?.includes("continuous")) {
      advanced.whiteBalanceMode = "continuous";
    }
    if (caps?.focusDistance) {
      focusDistanceBase = caps.focusDistance.min + 0.1;
      advanced.focusDistance = focusDistanceBase;
    }
    if (caps?.zoom) {
      advanced.zoom = Math.min(2.0, caps.zoom.max);
    }

    if (Object.keys(advanced).length > 0) {
      track.applyConstraints({ advanced: [advanced] } as any).catch(() => {});
    }
  };

  const startKickInterval = () => {
    if (intervalId) return;
    let tick = 0;

    intervalId = setInterval(() => {
      if (document.visibilityState === "hidden") return;

      const track = getTrack();
      if (!track) return;

      const caps = (track as any).getCapabilities?.();

      // Prefer varying focusDistance slightly
      if (caps?.focusDistance && focusDistanceBase > 0) {
        const delta = (tick % 2 === 0) ? 0.05 : -0.05;
        const fd = Math.max(caps.focusDistance.min,
          Math.min(focusDistanceBase + delta, caps.focusDistance.max));
        track.applyConstraints({
          advanced: [{ focusDistance: fd }]
        } as any).then(() => { errorCount = 0; }).catch(() => {
          errorCount++;
          if (errorCount >= 3) pauseAndBackoff();
        });
      } else {
        // Fallback: toggle focusMode
        track.applyConstraints({
          advanced: [{ focusMode: "manual" }]
        } as any)
          .then(() => track.applyConstraints({
            advanced: [{ focusMode: "continuous" }]
          } as any))
          .then(() => { errorCount = 0; })
          .catch(() => {
            errorCount++;
            if (errorCount >= 3) pauseAndBackoff();
          });
      }
      tick++;
    }, 2000);
  };

  const pauseAndBackoff = () => {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    backoffId = setTimeout(() => {
      errorCount = 0;
      startKickInterval();
    }, 10000);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    } else {
      startKickInterval();
    }
  };

  const timer = setTimeout(() => {
    applyInitialConstraints();
    startKickInterval();
  }, 800);

  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    clearTimeout(timer);
    if (intervalId) clearInterval(intervalId);
    if (backoffId) clearTimeout(backoffId);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}, [ref]);
```

**Constraints iniciais** permanecem iguais (720p com min 640x480) -- ja estao adequadas.

**Resumo das mudancas no arquivo:**
- Linhas 204-249: substituir o useEffect atual pelo novo com focus kick inteligente, visibility handling, exposure/whiteBalance, e backoff de erros.
- Nenhuma outra mudanca no arquivo.
