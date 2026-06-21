import { SidebarInset, SidebarProvider, SidebarRail } from "@/_shared/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar/app-sidebar";
import { AppEditor } from "@/app/components/app-editor/app-editor";
import { EditorContextProvider } from "@/app/contexts/editor-context/editor-context";
import { ProjectContextProvider } from "@/app/contexts/project-context/project-context";
import { RenderContextProvider } from "@/app/contexts/render-context/render-context";
import { VoicesContextProvider } from "@/app/contexts/voices-context/voices-context";
import { AppHeader } from "../components/app-header/app-header";

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <VoicesContextProvider>
        <ProjectContextProvider>
          <EditorContextProvider>
            <RenderContextProvider>{children}</RenderContextProvider>
          </EditorContextProvider>
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
