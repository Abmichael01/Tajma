import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 relative border border-transparent rounded-full",
  {
    variants: {
      variant: {
        // Primary - Main CTA buttons (Post Ad, Buy Now, etc.)
        primary: "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:border-primary/20",
        
        // Secondary - Secondary actions (Save, Share, etc.)
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:border-secondary/30",
        
        // Accent - Special actions (Contact Seller, Make Offer, etc.)
        accent: "bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary hover:border-primary/20",
        
        // Success - Confirmation actions
        success: "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:border-primary/20",
        
        // Warning - Important actions
        warning: "bg-primary/80 text-primary-foreground shadow-lg hover:bg-primary/90 hover:border-primary/20",
        
        // Destructive - Delete, Cancel actions
        destructive: "bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 hover:border-destructive/30",
        
        // Outline - Outlined buttons
        outline: "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400",
        
        // Ghost - Minimal buttons (Back, Close, etc.)
        ghost: "hover:bg-accent hover:text-accent-foreground hover:border-accent/30",
        
        // Link - Text-only buttons
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        sm: "h-8 px-4 py-2 text-xs gap-1.5",
        default: "h-10 px-6 py-2 gap-2",
        lg: "h-12 px-8 py-3 text-base gap-2.5",
        xl: "h-14 px-10 py-4 text-lg gap-3",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </Comp>
  )
}

export { Button, buttonVariants }
