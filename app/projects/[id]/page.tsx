import React, { Suspense } from "react";
import { ProjectWorkspaceClient } from "./ProjectWorkspaceClient";
import { Navbar } from "@/components/layout/Navbar";

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
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
          <Navbar />
          <div className="flex flex-1 items-center justify-center text-xs text-zinc-400">
            Loading project workspace...
          </div>
        </div>
      }
    >
      <ProjectWorkspaceClient id={id} />
    </Suspense>
  );
}
