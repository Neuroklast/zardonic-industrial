/* eslint-disable react-refresh/only-export-components */
import { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "cyber-btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-mono font-medium tracking-wider uppercase transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "cyber-btn--primary border border-primary/60 bg-primary/10 text-primary active:scale-[0.98]",
        destructive:
          "cyber-btn--destructive border border-destructive/60 bg-destructive/10 text-destructive active:scale-[0.98]",
        outline:
          "cyber-btn--outline border border-border/60 bg-transparent text-foreground active:scale-[0.98]",
        secondary:
          "cyber-btn--secondary border border-border/40 bg-secondary/40 text-secondary-foreground active:scale-[0.98]",
        ghost:
          "bg-transparent text-foreground hover:bg-primary/10 hover:text-primary active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary p-0 h-auto",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-sm has-[>svg]:px-3",
        sm: "h-8 rounded-sm gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-10 rounded-sm px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-sm",
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
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
