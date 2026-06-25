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
import { useProject } from "@/app/features/project";

function encodeProjectPathForUrl(projectPath: string) {
  return projectPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getProjectHref(projectPath: string) {
  return `/${encodeProjectPathForUrl(projectPath)}`;
}

function getDirectoryPath(project: ProjectFileSummary) {
  return project.segments.slice(0, -1).join("/");
}

function getDirectoryName(directoryPath: string) {
  if (!directoryPath) {
    return "Root";
  }

  const segments = directoryPath.split("/");
  return segments[segments.length - 1] ?? "Root";
}

function groupProjectsByDirectory(projects: ProjectFileSummary[]) {
  const groups = new Map<string, ProjectFileSummary[]>();

  for (const project of projects) {
    const directoryPath = getDirectoryPath(project);
    const current = groups.get(directoryPath) ?? [];
    current.push(project);
    groups.set(directoryPath, current);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([directoryPath, items]) => ({
      directoryPath,
      directoryName: getDirectoryName(directoryPath),
      items: [...items].sort((left, right) => right.updatedAt - left.updatedAt),
    }));
}

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
