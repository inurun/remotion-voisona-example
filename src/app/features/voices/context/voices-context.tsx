import { createContext, useContext } from "react";
import { useVoicesProviderValue } from "@/app/features/voices/context/use-voices-context";

const VoicesContext = createContext<ReturnType<typeof useVoicesProviderValue> | null>(null);

export function VoicesContextProvider({ children }: { children: React.ReactNode }) {
  const value = useVoicesProviderValue();
  return <VoicesContext.Provider value={value}>{children}</VoicesContext.Provider>;
}

export function useVoices() {
  const context = useContext(VoicesContext);
  if (!context) {
    throw new Error("VoicesContext is missing");
  }
  return context;
}
