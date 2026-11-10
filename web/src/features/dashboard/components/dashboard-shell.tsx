"use client";

import {
  BellIcon,
  BriefcaseBusinessIcon,
  BuildingIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  CreditCardIcon,
  FolderIcon,
  ForwardIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  LogOutIcon,
  MegaphoneIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RocketIcon,
  Settings2Icon,
  SparklesIcon,
  TargetIcon,
  Trash2Icon,
  UserCircle2Icon,
  UsersIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { appName } from "@/lib/app-config";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { logoutAction } from "@/features/auth/actions";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/config";

export type DashboardShellLabels = {
  account: string;
  addTeam: string;
  analytics: string;
  companies: string;
  contacts: string;
  customers: string;
  dashboard: string;
  deals: string;
  deleteProject: string;
  integrations: string;
  invoices: string;
  logout: string;
  notifications: string;
  opportunities: string;
  overview: string;
  payments: string;
  pipeline: string;
  platform: string;
  projects: string;
  quotes: string;
  reports: string;
  sales: string;
  settings: string;
  shareProject: string;
  team: string;
  teams: string;
  upgrade: string;
  viewProject: string;
  workspace: string;
};

type DashboardUser = { avatarUrl: string | null; email: string; name: string };

export function DashboardShell({
  children,
  labels,
  locale,
  user,
}: {
  children: React.ReactNode;
  labels: DashboardShellLabels;
  locale: Locale;
  user: DashboardUser;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <DashboardSidebar labels={labels} locale={locale} user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <span className="bg-border h-4 w-px" aria-hidden="true" />
            <Link
              className="text-sm font-semibold"
              href={localizePath(locale, "/dashboard")}
            >
              {appName}
            </Link>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function DashboardSidebar({
  labels,
  locale,
  user,
}: {
  labels: DashboardShellLabels;
  locale: Locale;
  user: DashboardUser;
}) {
  const pathname = usePathname();
  const navMain = [
    {
      title: labels.dashboard,
      icon: LayoutDashboardIcon,
      active: true,
      items: [
        { title: labels.overview, url: localizePath(locale, "/dashboard") },
        { title: labels.analytics, url: "#" },
        { title: labels.reports, url: "#" },
      ],
    },
    {
      title: labels.customers,
      icon: UsersIcon,
      items: [
        { title: labels.contacts, url: "#" },
        { title: labels.companies, url: "#" },
        { title: labels.deals, url: "#" },
      ],
    },
    {
      title: labels.sales,
      icon: LineChartIcon,
      items: [
        { title: labels.pipeline, url: "#" },
        { title: labels.opportunities, url: "#" },
        { title: labels.quotes, url: "#" },
        { title: labels.invoices, url: "#" },
      ],
    },
    {
      title: labels.settings,
      icon: Settings2Icon,
      items: [
        { title: labels.workspace, url: "#" },
        { title: labels.team, url: "#" },
        { title: labels.integrations, url: "#" },
      ],
    },
  ];
  const projects = [
    { name: "Sales Team", icon: TargetIcon },
    { name: "Customer Success", icon: BriefcaseBusinessIcon },
    { name: "Marketing", icon: MegaphoneIcon },
  ];

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <TeamSwitcher labels={labels} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{labels.platform}</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => (
              <Collapsible
                asChild
                className="group/collapsible"
                defaultOpen={item.active}
                key={item.title}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      <item.icon />
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={subItem.url === pathname}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{labels.projects}</SidebarGroupLabel>
          <SidebarMenu>
            {projects.map((project) => (
              <SidebarMenuItem key={project.name}>
                <SidebarMenuButton>
                  <project.icon />
                  <span>{project.name}</span>
                </SidebarMenuButton>
                <ProjectMenu labels={labels} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu labels={labels} locale={locale} user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function TeamSwitcher({ labels }: { labels: DashboardShellLabels }) {
  const { isMobile } = useSidebar();
  const teams = [
    { name: "SalesForge", plan: "Enterprise", icon: BuildingIcon },
    { name: "TechCo Solutions", plan: "Startup", icon: BriefcaseBusinessIcon },
    { name: "GrowthMate", plan: "Free", icon: RocketIcon },
  ];
  const [activeTeam, setActiveTeam] = useState(teams[0]!);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-open:bg-sidebar-accent"
              size="lg"
            >
              <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg">
                <activeTeam.icon />
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </span>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel>{labels.teams}</DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                className="gap-2 p-2"
                key={team.name}
                onSelect={() => setActiveTeam(team)}
              >
                <span className="flex size-6 items-center justify-center rounded-sm border">
                  <team.icon />
                </span>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <PlusIcon />
              {labels.addTeam}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function ProjectMenu({ labels }: { labels: DashboardShellLabels }) {
  const { isMobile } = useSidebar();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuAction aria-label={labels.viewProject} showOnHover>
          <MoreHorizontalIcon />
        </SidebarMenuAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMobile ? "end" : "start"}
        className="min-w-48"
        side={isMobile ? "bottom" : "right"}
      >
        <DropdownMenuItem>
          <FolderIcon />
          {labels.viewProject}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ForwardIcon />
          {labels.shareProject}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2Icon />
          {labels.deleteProject}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu({
  labels,
  locale,
  user,
}: {
  labels: DashboardShellLabels;
  locale: Locale;
  user: DashboardUser;
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const logout = useAction(logoutAction, {
    onError() {
      toast.error("Could not log out. Please try again.");
    },
    onSuccess() {
      router.replace(localizePath(locale, "/"));
      router.refresh();
    },
  });
  const initials = user.name.trim().slice(0, 2).toUpperCase() || "SN";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-open:bg-sidebar-accent"
              size="lg"
            >
              <Avatar className="rounded-lg">
                <AvatarImage
                  alt={user.name}
                  src={user.avatarUrl ?? undefined}
                />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </span>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <span className="flex items-center gap-2">
                <Avatar className="rounded-lg">
                  <AvatarImage
                    alt={user.name}
                    src={user.avatarUrl ?? undefined}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="grid">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs">{user.email}</span>
                </span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <SparklesIcon />
                {labels.upgrade}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={localizePath(locale, "/account")}>
                  <UserCircle2Icon />
                  {labels.account}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={localizePath(locale, "/dashboard/payments")}>
                  <CreditCardIcon />
                  {labels.payments}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon />
                {labels.notifications}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={logout.isPending}
              onSelect={() => logout.execute()}
            >
              <LogOutIcon />
              {labels.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
