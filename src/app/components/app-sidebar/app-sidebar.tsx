import { FolderOpen, File, Projector } from "lucide-react";
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/_shared/components/ui/sidebar";
import { useProject } from "@/app/features/project";
import { getProjectHref } from "@/app/features/project/lib/project-path";
import { cn } from "@/_shared/lib/utils";
import { AddProjectDialog } from "@/app/components/app-sidebar/add-dialog/add-dialog";
import { DuplicateProjectDialog } from "@/app/components/app-sidebar/duplicate-dialog/duplicate-dialog";

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
  className,
  style,
}: {
  directoryName: string;
  directoryPath: string;
  items: ProjectFileSummary[];
  selectedProjectPath: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <AccordionItem
      value={directoryPath || "root"}
      className={cn("border-none", className)}
      style={style}
    >
      <AccordionTrigger className="px-2 py-2 hover:no-underline">
        <span className="flex items-center gap-2">
          <FolderOpen className="size-4" />
          <span>{directoryName}</span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        <SidebarMenu>
          {items.map((project, i) => (
            <SidebarMenuItem
              key={project.path}
              className="animate-in fade-in fill-mode-both pl-2"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <SidebarMenuButton
                render={<a href={getProjectHref(project.path)} />}
                isActive={project.path === selectedProjectPath}
                className="gap-2"
              >
                <File className="size-4" />
                <span>{project.name}</span>
              </SidebarMenuButton>
              <DuplicateProjectDialog project={project} />
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
          <div className="flex w-full items-center justify-between gap-2 text-sm font-semibold">
            <span className="flex min-w-0 items-center gap-2">
              <Projector className="size-4 shrink-0" />
              <span className="font-serif group-data-[collapsible=icon]:hidden">Projects</span>
            </span>
            <AddProjectDialog />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pt-0">
            <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
              {projects.length > 0 && (
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
              )}
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
