import { FolderOpen, FileJson, Files } from "lucide-react";
import type { ProjectFileSummary } from "@/_schemas";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/_shared/components/ui/accordion";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/_shared/components/ui/sidebar";
import { groupProjectsByDirectory } from "@/app/features/project/project-navigation";
import { getProjectHref } from "@/app/features/project/project-path";
import { useProject } from "@/app/contexts/project-context/project-context";

function Directory({
  directoryName,
  directoryPath,
  items,
  selectedProjectPath,
}: {
  directoryName: string;
  directoryPath: string;
  items: ProjectFileSummary[];
  selectedProjectPath: string | null;
}) {
  return (
    <AccordionItem value={directoryPath || "root"} className="border-none">
      <AccordionTrigger className="px-2 py-2 hover:no-underline">
        <span className="flex items-center gap-2">
          <FolderOpen className="size-4" />
          <span>{directoryName}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <SidebarMenu>
          {items.map((project) => (
            <SidebarMenuItem key={project.path}>
              <SidebarMenuButton
                render={<a href={getProjectHref(project.path)} />}
                isActive={project.path === selectedProjectPath}
                className="gap-2"
              >
                <FileJson className="size-4" />
                <span>{project.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </AccordionContent>
    </AccordionItem>
  );
}

export function AppSidebar() {
  const { projects, projectPath } = useProject();
  const groups = groupProjectsByDirectory(projects);
  return (
    <>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="gap-1 px-3 py-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Files className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Projects</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pt-0">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Project Files
            </SidebarGroupLabel>
            <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
              <Accordion
                defaultValue={groups.map((group) => group.directoryPath || "root")}
                multiple
                className="w-full"
              >
                {groups.map((group) => (
                  <Directory
                    key={group.directoryPath || "root"}
                    directoryName={group.directoryName}
                    directoryPath={group.directoryPath}
                    items={group.items}
                    selectedProjectPath={projectPath}
                  />
                ))}
              </Accordion>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="items-end px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
          <SidebarTrigger />
        </SidebarFooter>
      </Sidebar>
      <SidebarRail />
    </>
  );
}
