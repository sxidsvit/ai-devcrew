"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MAX_LOGO_BYTES, WORKSPACE_NAME_MAX, WORKSPACE_NAME_MIN } from "@/lib/workspace-limits";
import { updateWorkspaceSettingsAction, type WorkspaceSettingsState } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPicker } from "@/components/workspace/icon-picker";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import { DEFAULT_WORKSPACE_ICON, isWorkspaceIcon, type WorkspaceIconKey } from "@/components/workspace/workspace-icons";

export function WorkspaceSettingsForm({
  name: savedName,
  icon: savedIcon,
  logoUrl,
}: {
  name: string;
  icon: string;
  logoUrl: string | null;
}) {
  const [state, dispatch, pending] = useActionState<WorkspaceSettingsState, FormData>(updateWorkspaceSettingsAction, {});
  const initialIcon = isWorkspaceIcon(savedIcon) ? savedIcon : DEFAULT_WORKSPACE_ICON;

  const [name, setName] = useState(savedName);
  const [icon, setIcon] = useState<WorkspaceIconKey>(initialIcon);
  // A newly picked file, or whether the saved logo was removed.
  const [upload, setUpload] = useState<{ file: File; url: string } | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => () => {
    if (upload) URL.revokeObjectURL(upload.url);
  }, [upload]);

  // Saving returns fresh props from the server; start from them again.
  const [savedProps, setSavedProps] = useState({ savedName, initialIcon, logoUrl });
  if (savedProps.savedName !== savedName || savedProps.initialIcon !== initialIcon || savedProps.logoUrl !== logoUrl) {
    setSavedProps({ savedName, initialIcon, logoUrl });
    setName(savedName);
    setIcon(initialIcon);
    setUpload(null);
    setLogoRemoved(false);
  }

  function changeLogo(file: File | null) {
    setLogoError(null);
    if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return setLogoError("Logo must be a PNG, JPG or WebP image.");
    }
    if (file && file.size > MAX_LOGO_BYTES) return setLogoError("Logo must be 1 MB or smaller.");
    setUpload(file ? { file, url: URL.createObjectURL(file) } : null);
    setLogoRemoved(!file && !!logoUrl);
  }

  const trimmedName = name.trim();
  const nameValid = trimmedName.length >= WORKSPACE_NAME_MIN && trimmedName.length <= WORKSPACE_NAME_MAX;
  const logoPreview = upload?.url ?? (logoRemoved ? null : logoUrl);
  const logoMode = upload ? "replace" : logoRemoved ? "remove" : "keep";
  const dirty = trimmedName !== savedName || icon !== initialIcon || logoMode !== "keep";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!nameValid || !dirty || pending) return;
    // Built by hand so React doesn't reset the form (and the picked logo) after the action.
    const data = new FormData();
    data.set("name", trimmedName);
    data.set("icon", icon);
    data.set("logo", logoMode);
    if (upload) data.set("logoFile", upload.file);
    startTransition(() => dispatch(data));
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {state.error && <FormAlert tone="error">{state.error}</FormAlert>}
      {state.saved && !dirty && !pending && <FormAlert tone="success">Workspace settings saved.</FormAlert>}

      <section className="rounded-2xl border bg-card p-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Name and icon</h2>
          <p className="text-sm text-subtle">How this workspace appears in the sidebar and the workspace picker.</p>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-2 sm:w-28">
            <WorkspaceAvatar icon={icon} logoUrl={logoPreview} size="lg" />
            <p className="max-w-28 truncate text-center text-xs font-medium text-subtle">{trimmedName || "Your workspace"}</p>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={WORKSPACE_NAME_MAX}
                autoComplete="off"
                aria-invalid={state.field === "name" || (!nameValid && name !== savedName) || undefined}
              />
              <p className="flex justify-between text-xs text-faint">
                <span>Task keys on the board are based on this name.</span>
                <span>
                  {trimmedName.length}/{WORKSPACE_NAME_MAX}
                </span>
              </p>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker icon={icon} logoPreview={logoPreview} onIconChange={setIcon} onLogoChange={changeLogo} />
              {logoError && <p className="text-xs text-destructive">{logoError}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg" className="h-10 px-5" disabled={pending || !dirty || !nameValid}>
          {pending && <Loader2 className="animate-spin" />}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
