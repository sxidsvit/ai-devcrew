"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOGO_ACCEPT } from "@/lib/workspace-limits";
import { cn } from "@/lib/utils";
import { WORKSPACE_ICONS, type WorkspaceIconKey } from "@/components/workspace/workspace-icons";

const ICON_ENTRIES = Object.entries(WORKSPACE_ICONS) as [WorkspaceIconKey, (typeof WORKSPACE_ICONS)[WorkspaceIconKey]][];

export function IconPicker({
  icon,
  logoPreview,
  onIconChange,
  onLogoChange,
}: {
  icon: WorkspaceIconKey;
  logoPreview: string | null;
  onIconChange: (icon: WorkspaceIconKey) => void;
  onLogoChange: (file: File | null) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Workspace icon" className="grid grid-cols-6 gap-2">
        {ICON_ENTRIES.map(([key, Icon]) => {
          const selected = !logoPreview && icon === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={key}
              onClick={() => {
                onIconChange(key);
                onLogoChange(null);
              }}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border bg-card text-subtle transition-colors outline-none hover:border-brand-accent hover:bg-brand-tint hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/40",
                selected && "border-primary bg-brand-tint text-primary ring-2 ring-primary/20",
              )}
            >
              <Icon className="size-5" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted px-3 py-2.5">
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreview} alt="" className="size-9 rounded-md border object-cover" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-md bg-card text-faint ring-1 ring-border">
            <ImagePlus className="size-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-heading">{logoPreview ? "Custom logo" : "Or upload your own logo"}</p>
          <p className="text-xs text-subtle">PNG, JPG or WebP, up to 1 MB. Square works best.</p>
        </div>
        {logoPreview ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onLogoChange(null)}>
            <X />
            Remove
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            Upload
          </Button>
        )}
        <input
          ref={fileInput}
          type="file"
          accept={LOGO_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload workspace logo"
          onChange={(event) => {
            onLogoChange(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
