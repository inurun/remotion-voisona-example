import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { PageList } from "@/app/components/app-editor/editor-card/page-list/page-list";
import { PageContent } from "@/app/components/app-editor/editor-card/page-content/page-content";
import { PageHeader } from "@/app/components/app-editor/editor-card/page-header/page-header";
import { TtsList } from "@/app/components/app-editor/editor-card/tts-list/tts-list";
import { usePage } from "@/app/features/page";

export function EditorCard() {
  const { pageFields, selectedPageIndex } = usePage();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl">Editor</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-[minmax(50px,180px)_minmax(200px,1fr)]">
          <PageList />
          {selectedPageIndex !== null && pageFields[selectedPageIndex] && (
            <div key={pageFields[selectedPageIndex].id} className="grid gap-4">
              <PageHeader />
              <PageContent />
              <TtsList />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
