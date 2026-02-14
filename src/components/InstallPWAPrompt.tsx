import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !(window as any).MSStream;

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as any).standalone === true;

export const InstallPWAPrompt = () => {
  const [open, setOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If iOS (no beforeinstallprompt), show manual guide
    const timeout = setTimeout(() => {
      if (isStandalone()) return;
      if (isIOS()) {
        setShowIOSGuide(true);
        setOpen(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timeout);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setOpen(false);
  };

  // Don't render if already standalone
  if (isStandalone()) return null;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-[90vw] rounded-xl">
        <AlertDialogHeader>
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
              <Download className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <AlertDialogTitle className="text-center text-lg">
            Instalar Contagem de Estoque
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm">
            {showIOSGuide ? (
              <span className="flex flex-col items-center gap-2 mt-1">
                <span>
                  Toque no botão{" "}
                  <Share className="inline h-4 w-4 -mt-0.5" />{" "}
                  <strong>Compartilhar</strong> e depois em{" "}
                  <strong>"Adicionar à Tela de Início"</strong>.
                </span>
              </span>
            ) : (
              "Instale o app na sua tela inicial para acesso rápido e uso offline."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          {showIOSGuide ? (
            <AlertDialogAction onClick={() => setOpen(false)}>
              Entendi
            </AlertDialogAction>
          ) : (
            <AlertDialogAction onClick={handleInstall} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Instalar Agora
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
