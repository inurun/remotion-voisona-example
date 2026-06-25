import { createContext, useContext } from "react";
import { usePageProviderValue } from "@/app/features/page/context/page-context.hook";

const PageContext = createContext<ReturnType<typeof usePageProviderValue> | null>(null);

export function PageContextProvider({ children }: { children: React.ReactNode }) {
  const value = usePageProviderValue();
  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

export function usePage() {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error("PageContext is missing");
  }
  return context;
}
