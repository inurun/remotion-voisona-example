import { createContext, useContext } from "react";
import { FormProvider } from "react-hook-form";
import { useProject } from "@/app/contexts/project-context/project-context";
import { useVoices } from "@/app/contexts/voices-context/voices-context";
import { useFormProviderValue } from "@/app/contexts/form-context/form-context.hook";

const FormContext = createContext<ReturnType<typeof useFormProviderValue>["value"] | null>(null);

export function FormContextProvider({ children }: { children: React.ReactNode }) {
  const { project } = useProject();
  const { options } = useVoices();
  const { form, value } = useFormProviderValue({
    initialProject: project,
    voiceOptions: options,
  });

  return (
    <FormProvider {...form}>
      <FormContext.Provider value={value}>{children}</FormContext.Provider>
    </FormProvider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("FormContext is missing");
  }
  return context;
}

export { getVoiceValue } from "@/app/contexts/form-context/form-context.hook";
