import { createContext, useContext } from "react";
import { FormProvider } from "react-hook-form";
import { useProject } from "@/app/contexts/project-context/project-context";
import { useEditorProviderValue } from "@/app/contexts/editor-context/editor-context.hook";

const EditorContext = createContext<ReturnType<typeof useEditorProviderValue>["value"] | null>(
  null,
);

export function EditorContextProvider({ children }: { children: React.ReactNode }) {
  const { project } = useProject();
  const { form, value } = useEditorProviderValue(project);

  return (
    <FormProvider {...form}>
      <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
    </FormProvider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("EditorContext is missing");
  }
  return context;
}
