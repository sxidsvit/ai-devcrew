import { LogOut } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { UserAvatar } from "@/components/layout/user-avatar";

// Top bar for signed-in pages. `children` renders next to the logo (e.g. a workspace switcher).
export function AppHeader({ user, children }: { user: AuthUser; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Logo href="/workspaces" />
          {children}
        </div>
        <div className="flex items-center gap-2">
          <UserAvatar user={user} />
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm" className="text-subtle">
              <LogOut />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
