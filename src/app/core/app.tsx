import { SidebarInset, SidebarProvider } from "@/_shared/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar/app-sidebar";
import { AppEditor } from "@/app/components/app-editor/app-editor";
import { EditorContextProvider } from "@/app/features/editor";
import { FormContextProvider } from "@/app/features/editor";
import { PageContextProvider } from "@/app/features/page";
import { ProjectContextProvider } from "@/app/features/project";
import { RenderContextProvider } from "@/app/features/render";
import { TtsContextProvider } from "@/app/features/tts";
import { VoicesContextProvider } from "@/app/features/voices";
import { AppHeader } from "../components/app-header/app-header";

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <VoicesContextProvider>
        <ProjectContextProvider>
          <FormContextProvider>
            <PageContextProvider>
              <EditorContextProvider>
                <TtsContextProvider>
                  <RenderContextProvider>{children}</RenderContextProvider>
                </TtsContextProvider>
              </EditorContextProvider>
            </PageContextProvider>
          </FormContextProvider>
        </ProjectContextProvider>
      </VoicesContextProvider>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppSidebar />
      <SidebarInset>
        <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-2 p-2">
          <AppHeader />
          <AppEditor />
        </main>
      </SidebarInset>
    </AppProviders>
  );
}
