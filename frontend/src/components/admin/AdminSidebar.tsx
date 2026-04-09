"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Mail,
  LogOut,
  ChevronLeft as LucideChevronLeft,
  ChevronRight as LucideChevronRight,
  Globe2,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Star,
  MousePointer2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { LayoutGrid } from "@/components/icons/icons/LayoutGrid";
import { Users } from "@/components/icons/icons/Users";
import { PackageOpen } from "@/components/icons/icons/PackageOpen";
import { Folders } from "@/components/icons/icons/Folders";
import { BellRing } from "@/components/icons/icons/BellRing";

const menuItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutGrid,
    isAnimated: true,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    isAnimated: true,
  },
  {
    label: "Ads",
    href: "/admin/ads",
    icon: PackageOpen,
    isAnimated: true,
  },
  {
    label: "Leads",
    href: "/admin/leads",
    icon: MousePointer2,
    isAnimated: false,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Folders,
    isAnimated: true,
  },
  {
    label: "Regions",
    href: "/admin/regions",
    icon: MapPin,
    isAnimated: true,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: BellRing,
    isAnimated: true,
  },
  {
    label: "Chats",
    href: "/admin/chats",
    icon: MessageSquare,
    isAnimated: false,
  },
  {
    label: "Messages",
    href: "/admin/messages",
    icon: Mail,
    isAnimated: false,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: AlertCircle,
    isAnimated: false,
  },
  {
    label: "KYC Requests",
    href: "/admin/kyc",
    icon: ShieldCheck,
    isAnimated: false,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: Star,
    isAnimated: false,
  },
  {
    label: "View Site",
    href: "/",
    icon: Globe2,
    isAnimated: false,
  },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({
  isCollapsed,
  onToggle,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="bg-gray-50 h-full flex flex-col rounded-2xl border border-gray-100 w-full py-4">
      {/* Logo/Header */}
      <div className="px-4 mb-4">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border border-gray-200 rounded-2xl p-3 flex items-center gap-3 bg-white">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg font-bold">A</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate">Admin Panel</span>
                  <span className="text-xs text-gray-500 truncate">Dashboard</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-white text-lg font-bold">A</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto admin-sidebar-scrollbar pr-2">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // Special handling for Dashboard - only active on exact match
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin" || pathname === "/admin/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 py-2 transition-all duration-200 relative px-4 
                    ${
                      isActive
                        ? 'text-secondary before:content-[""] before:bg-secondary before:w-1 before:h-[60%] before:rounded-r-2xl before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2'
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                    ${ isCollapsed && "justify-center " }
                  `}
                >
                  {item.isAnimated ? (
                    <div
                      className="flex-shrink-0 "
                      style={{
                        width: "16px",
                        height: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon
                        width={16}
                        height={16}
                        stroke={isActive ? "currentColor" : "currentColor"}
                        strokeWidth={2}
                      />
                    </div>
                  ) : (
                    <Icon className="flex-shrink-0 w-4 h-4" />
                  )}
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer/Logout */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && (
            <AnimatePresence mode="wait">
              <motion.span
                key="logout"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            </AnimatePresence>
          )}
        </button>
      </div>
    </aside>
  );
}
