import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

export function AppHeader() {
  const { user } = useAuth();
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "AD";

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        {/* <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            className="pl-9 w-64 bg-muted border-none h-9"
          />
        </div> */}
      </div>
      <div className="flex items-center gap-4">
        {/* <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-stat-pink rounded-full border-2 border-card" />
        </button> */}
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {user?.name && (
            <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
          )}
        </div>
      </div>
    </header>
  );
}
