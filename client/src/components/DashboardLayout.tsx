import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, Bot, BusFront, CreditCard, LayoutDashboard, LogOut, PanelLeft, ReceiptText, Settings2, Sparkles } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/" },
  { icon: CreditCard, label: "Payments", path: "/payments" },
  { icon: ReceiptText, label: "Bills & plans", path: "/bills" },
  { icon: BusFront, label: "Services", path: "/services" },
  { icon: Activity, label: "Activity", path: "/activity" },
  { icon: Settings2, label: "AI Controls", path: "/controls" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 248;
const MIN_WIDTH = 200;
const MAX_WIDTH = 360;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [preview, setPreview] = useState(() => localStorage.getItem("momentum-preview") === "1");

  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()), [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;

  if (!user && !preview) {
    return (
      <div className="min-h-screen bg-[#f5f7f4] text-[#18342e] relative overflow-hidden">
        <div className="absolute -top-40 -right-28 h-[460px] w-[460px] rounded-full bg-[#c6f2d5]/70 blur-3xl" />
        <div className="absolute -bottom-44 -left-20 h-[360px] w-[360px] rounded-full bg-[#dcd3ff]/70 blur-3xl" />
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#18342e] text-[#b8f5cf]"><Sparkles className="h-5 w-5" /></div><div><p className="font-display text-xl font-semibold tracking-tight">Momentum</p><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6c8179]">Unified payments · demo</p></div></div>
            <span className="rounded-full border border-[#cfe4d6] bg-white/70 px-3 py-1.5 text-xs font-medium text-[#557268]">Simulated rails</span>
          </div>
          <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_.95fr]">
            <div className="max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#dff7e7] px-3 py-1.5 text-xs font-semibold text-[#277451]"><Bot className="h-3.5 w-3.5" /> Built for the next everyday payment</p>
              <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-[#18342e] sm:text-7xl">Move money.<br /><span className="text-[#4d9b6d]">Keep context.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#60766d]">Momentum brings person-to-person payments, bill intelligence, commute guidance, and a voice assistant into one calm control room.</p>
              <div className="mt-9 flex flex-wrap gap-3"><Button className="h-12 rounded-xl bg-[#18342e] px-6 text-white hover:bg-[#244d42]" onClick={() => startLogin()}>Sign in with Manus</Button><Button variant="outline" className="h-12 rounded-xl border-[#cfe4d6] bg-white/70 px-6 text-[#18342e]" onClick={() => { localStorage.setItem("momentum-preview", "1"); setPreview(true); }}>Preview the demo</Button></div>
              <p className="mt-4 max-w-lg text-xs leading-5 text-[#7b8f87]">No real bank connections, KYC, money movement, or provider switching are present. This preview is a portfolio demonstration.</p>
            </div>
            <div className="relative mx-auto w-full max-w-md"><div className="absolute -inset-3 rounded-[2rem] bg-[#18342e]/5 blur-2xl" /><div className="relative rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_24px_80px_rgba(24,52,46,.14)] backdrop-blur"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6f8980]">Available balance</p><p className="mt-2 font-display text-4xl font-semibold tracking-tight">$2,840<span className="text-xl text-[#8da29a]">.00</span></p></div><span className="rounded-full bg-[#dff7e7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2d7852]">Demo</span></div><div className="mt-8 h-3 overflow-hidden rounded-full bg-[#edf3ef]"><div className="h-full w-[72%] rounded-full bg-[#8dd8a9]" /></div><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#f3f7f4] p-4"><p className="text-xs text-[#7a9187]">This month</p><p className="mt-2 font-semibold">$1,284.62</p><p className="mt-1 text-xs text-[#4d9b6d]">↓ 8.4% vs Aug</p></div><div className="rounded-2xl bg-[#f5f1ff] p-4"><p className="text-xs text-[#7d7198]">AI savings</p><p className="mt-2 font-semibold">$31.00</p><p className="mt-1 text-xs text-[#8c74bb]">3 opportunities</p></div></div><div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#18342e] p-4 text-white"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#366e5d]"><Sparkles className="h-4 w-4 text-[#b8f5cf]" /></div><div><p className="text-sm font-semibold">Hey Yuna</p><p className="text-xs text-[#b2cbc0]">Your voice copilot is ready</p></div><span className="ml-auto h-2 w-2 rounded-full bg-[#9ae7b5] shadow-[0_0_0_5px_rgba(154,231,181,.12)]" /></div></div></div>
          </div>
        </div>
      </div>
    );
  }

  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth} preview={preview} setPreview={setPreview}>{children}</DashboardLayoutContent></SidebarProvider>;
}

type DashboardLayoutContentProps = { children: React.ReactNode; setSidebarWidth: (width: number) => void; preview: boolean; setPreview: (value: boolean) => void };

function DashboardLayoutContent({ children, setSidebarWidth, preview, setPreview }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const displayUser = user ?? { name: "Alex Morgan", email: "preview@momentum.demo" };

  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { if (!isResizing) return; const left = sidebarRef.current?.getBoundingClientRect().left ?? 0; const width = e.clientX - left; if (width >= MIN_WIDTH && width <= MAX_WIDTH) setSidebarWidth(width); };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) { document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; }
    return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; };
  }, [isResizing, setSidebarWidth]);

  const signOut = () => { if (preview) { localStorage.removeItem("momentum-preview"); setPreview(false); } else logout(); };
  return <>
    <div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className="border-r border-[#e5eee8] bg-[#f8fbf8]" disableTransition={isResizing}>
      <SidebarHeader className="h-20 justify-center"><div className="flex w-full items-center gap-3 px-2"><button onClick={toggleSidebar} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#18342e] text-[#b8f5cf] transition hover:bg-[#2b5749] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#68b884]"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div className="min-w-0"><p className="font-display text-lg font-semibold tracking-tight text-[#18342e]">Momentum</p><p className="truncate text-[10px] font-semibold uppercase tracking-[0.17em] text-[#789086]">Unified payments</p></div>}</div></SidebarHeader>
      <SidebarContent className="gap-0"><div className="px-3 pb-3 pt-1">{!isCollapsed && <div className="rounded-xl border border-[#d9efe0] bg-[#e9f8ed] px-3 py-2 text-[11px] leading-4 text-[#357052]"><span className="font-semibold">Demo mode</span><br />Every rail is simulated.</div>}</div><SidebarMenu className="px-2 py-1">{menuItems.map(item => { const active = location === item.path; return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={active} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-11 rounded-xl font-medium transition ${active ? "bg-[#e0f4e6] text-[#1e6846]" : "text-[#668077] hover:bg-[#eef5f0] hover:text-[#18342e]"}`}><item.icon className={`h-[17px] w-[17px] ${active ? "text-[#3d9b64]" : ""}`} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu></SidebarContent>
      <SidebarFooter className="p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left transition hover:bg-[#eef5f0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#68b884]"><Avatar className="h-9 w-9 shrink-0 border border-[#cae5d1]"><AvatarFallback className="bg-[#dff6e6] text-xs font-semibold text-[#397653]">{displayUser.name?.charAt(0).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold text-[#29473e]">{displayUser.name}</p><p className="mt-1 truncate text-xs text-[#789086]">{displayUser.email}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuItem onClick={signOut} className="cursor-pointer text-[#b64c4c] focus:text-[#b64c4c]"><LogOut className="mr-2 h-4 w-4" /><span>{preview ? "Exit preview" : "Sign out"}</span></DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter>
    </Sidebar><div className={`absolute right-0 top-0 z-50 h-full w-1 cursor-col-resize transition-colors hover:bg-[#8ed4a6]/40 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => !isCollapsed && setIsResizing(true)} /></div>
    <SidebarInset className="bg-[#f7faf7]">{isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-[#e5eee8] bg-[#f7faf7]/95 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-xl" /><span className="font-medium text-[#29473e]">{activeMenuItem?.label ?? "Momentum"}</span></div>}<main className="min-h-screen flex-1">{children}</main></SidebarInset>
  </>;
}
