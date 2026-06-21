"use client";

import type { SavedProject } from "@/_schemas";
import { EditorCard } from "@/app/components/editor-card";
import { PlayerCard } from "@/app/components/player-card";
import { RenderCard } from "@/app/components/render-card";
import { type useEditorActions } from "@/app/features/editor/editor-actions";
import { type useRenderState } from "@/app/features/render/render-state";
import { type VoiceState } from "@/app/features/voisona/voices";

type AppContentProps = {
  project: SavedProject;
  voices: VoiceState;
  voicesAvailable: boolean;
  loadVoices: () => Promise<void>;
  editorActions: ReturnType<typeof useEditorActions>;
  renderState: ReturnType<typeof useRenderState>["renderState"];
  startRender: () => Promise<void>;
};

function ProjectWorkspace({
  project,
  voices,
  voicesAvailable,
  loadVoices,
  editorActions,
  renderState,
  startRender,
}: AppContentProps) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
      <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
        <PlayerCard project={project} />
        <RenderCard
          editorActions={editorActions}
          renderState={renderState}
          startRender={startRender}
          voicesAvailable={voicesAvailable}
        />
      </aside>

      <EditorCard
        project={project}
        voices={voices}
        loadVoices={loadVoices}
        editorActions={editorActions}
      />
    </div>
  );
}

export function AppContent({
  project,
  voices,
  voicesAvailable,
  loadVoices,
  editorActions,
  renderState,
  startRender,
}: AppContentProps) {
  return (
    <ProjectWorkspace
      project={project}
      voices={voices}
      voicesAvailable={voicesAvailable}
      loadVoices={loadVoices}
      editorActions={editorActions}
      renderState={renderState}
      startRender={startRender}
    />
  );
}
