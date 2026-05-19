import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Settings,
  LogOut,
  Pill,
  Factory,
  Zap,
  Section,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Sản phẩm", url: "/quan-ly-san-pham", icon: Package },
  { title: "Sự kiện", url: "/quan-ly-su-kien", icon: Zap},
  { title: "Đơn hàng", url: "/quan-ly-don-hang", icon: ShoppingCart },
  { title: "Khách hàng", url: "/danh-sach-nguoi-dung", icon: Users },
  { title: "Thẻ", url: "/quan-ly-the", icon: Pill },
  { title: "Danh mục", url: "/quan-ly-danh-muc", icon: FolderTree },
  { title: "Nhà cung cấp", url: "/quan-ly-nha-cung-cap", icon: Factory},
  { title: "Nội dung", url: "/quan-ly-noi-dung", icon: Section},
  { title: "Cài đặt", url: "/cai-dat", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-4 mt-2">
            <div className="flex items-center gap-2">
              {/* <Pill className="h-6 w-6 text-primary" /> */}
              {!collapsed && <span className="text-lg font-bold text-primary">PharAdmin</span>}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="hover:bg-destructive-foreground text-muted-foreground hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Đăng xuất</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
