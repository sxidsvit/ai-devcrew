import { cn } from "@/lib/utils";
import { DEFAULT_WORKSPACE_ICON, WORKSPACE_ICONS, isWorkspaceIcon } from "@/components/workspace/workspace-icons";

const SIZES = {
  sm: "size-8 rounded-lg [&_svg]:size-4",
  md: "size-10 rounded-lg [&_svg]:size-5",
  lg: "size-16 rounded-2xl [&_svg]:size-7",
};

// Shows a workspace's uploaded logo, or its built-in icon on a brand tint.
export function WorkspaceAvatar({
  icon,
  logoUrl,
  size = "md",
  className,
}: {
  icon: string;
  logoUrl?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const Icon = WORKSPACE_ICONS[isWorkspaceIcon(icon) ? icon : DEFAULT_WORKSPACE_ICON];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-brand-soft bg-brand-tint text-primary",
        SIZES[size],
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-full object-cover" />
      ) : (
        <Icon />
      )}
    </span>
  );
}
