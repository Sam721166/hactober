import React, { Suspense } from "react";
import { ProjectWorkspaceClient } from "./ProjectWorkspaceClient";

export const instant = false;

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400 font-mono">
          Loading project workspace...
        </div>
      }
    >
      <ProjectWorkspaceClient id={id} />
    </Suspense>
  );
}
