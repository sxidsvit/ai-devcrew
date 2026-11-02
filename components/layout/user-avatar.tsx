import type { AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type UserSummary = Pick<AuthUser, "name" | "email" | "image">;

export function userInitials(user: UserSummary) {
  return (user.name || user.email).slice(0, 2).toUpperCase();
}

// The signed-in user's profile photo, falling back to their initials.
export function UserAvatar({ user, className }: { user: UserSummary; className?: string }) {
  return (
    <Avatar className={cn("size-8", className)}>
      {user.image && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback className="bg-brand-soft text-xs font-semibold text-primary-hover">
        {userInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
}
