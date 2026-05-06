"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"

interface ResponsiveModalProps {
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  className?: string
  hideHeader?: boolean
}

export function ResponsiveModal({
  children,
  isOpen,
  onClose,
  title,
  description,
  className,
  hideHeader = false
}: ResponsiveModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={cn("max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[32px]", className)}>
          {!hideHeader && (title || description) && (
            <DialogHeader className="px-6 pt-6">
              {title && <DialogTitle className="text-xl font-bold text-gray-900">{title}</DialogTitle>}
              {description && (
                <DialogDescription>{description}</DialogDescription>
              )}
            </DialogHeader>
          )}
          <div className={cn("px-6 pb-6", hideHeader ? "pt-6" : "pt-2")}>
            {children}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className={cn("max-h-[96vh] rounded-t-[32px] border-none", className)}>
        {!hideHeader && (title || description) && (
          <DrawerHeader className="text-left pb-2 flex-shrink-0 px-6 pt-6">
            {title && <DrawerTitle className="text-lg font-bold text-gray-900">{title}</DrawerTitle>}
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
        )}
        <div className={cn("px-6 pb-8 overflow-y-auto custom-scrollbar", hideHeader ? "pt-6" : "pt-2")}>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
