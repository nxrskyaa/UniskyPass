"use client";

import * as Toast from "@radix-ui/react-toast";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "success" | "error" | "info";

type ToastMessage = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = Omit<ToastMessage, "id">;

const ToastContext = createContext<((message: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const notify = useCallback((message: ToastInput) => {
    setMessages((current) => [
      ...current,
      { ...message, id: Date.now() + Math.floor(Math.random() * 1_000) },
    ]);
  }, []);

  const contextValue = useMemo(() => notify, [notify]);

  return (
    <ToastContext.Provider value={contextValue}>
      <Toast.Provider swipeDirection="right" duration={5_000}>
        {children}
        {messages.map((message) => {
          const Icon =
            message.tone === "success"
              ? CheckCircle2
              : message.tone === "error"
                ? CircleAlert
                : Info;
          return (
            <Toast.Root
              key={message.id}
              defaultOpen
              onOpenChange={(open) => {
                if (!open) {
                  setMessages((current) =>
                    current.filter((item) => item.id !== message.id),
                  );
                }
              }}
              className="grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 rounded-2xl border border-ink bg-ink p-4 text-white shadow-[5px_5px_0_var(--violet)] data-[state=open]:animate-[toast-in_.2s_ease-out]"
            >
              <Icon className="mt-0.5 size-5 text-lime" aria-hidden />
              <div>
                <Toast.Title className="font-semibold">{message.title}</Toast.Title>
                {message.description ? (
                  <Toast.Description className="mt-1 text-sm text-white/70">
                    {message.description}
                  </Toast.Description>
                ) : null}
              </div>
              <Toast.Close
                className="rounded-md p-1 text-white/65 hover:bg-white/10 hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </Toast.Close>
            </Toast.Root>
          );
        })}
        <Toast.Viewport className="fixed right-4 bottom-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 outline-none" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
