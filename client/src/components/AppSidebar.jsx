import {
  LayoutDashboard,
  Package,
  Users,
  Search,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  // { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Items Master", url: "/items", icon: Package },
  { title: "Vendors Master", url: "/vendors", icon: Users },
  { title: "Search & Pin", url: "/search", icon: Search },
  // { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <div className=" h-13 p-2 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-primary-foreground font-bold text-xs">
              VM
            </div>
            {open && (
              <div>
                <h2 className="font-semibold text-sm text-indigo-600">
                  Vendor Manager
                </h2>
                <p className="text-xs text-sidebar-foreground/70">
                  Pro Edition
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 px-4">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-indigo-600 transition-colors"
                      activeClassName="bg-sidebar-accent text-indigo-600 font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
