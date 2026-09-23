import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* shadcn/ui button, trimmed to this site's rules: focus is the global 2px
   outline (no ring), and two extra variants cover the in-text buttons the
   document is full of — `inline` is an underlined link-like button, `plain`
   inherits everything and styles itself with utilities. */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,text-decoration-color] duration-150 outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        inline:
          "h-auto justify-start rounded-[2px] p-0 text-left font-normal whitespace-normal text-primary underline decoration-rule underline-offset-[3px] hover:decoration-primary text-[length:inherit] leading-[inherit]",
        plain:
          "h-auto justify-start rounded-none p-0 text-left font-normal whitespace-normal text-[length:inherit] leading-[inherit] text-inherit",
      },
      size: {
        default: "h-9 px-4 py-2",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const resolvedSize = size ?? (variant === "inline" || variant === "plain" ? "none" : "default")

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={resolvedSize}
      className={cn(buttonVariants({ variant, size: resolvedSize, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
