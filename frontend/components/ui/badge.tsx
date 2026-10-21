import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white",
        secondary: "border-transparent bg-slate-100 text-slate-900",
        destructive: "border-transparent bg-red-100 text-red-800 border-red-200",
        outline: "text-slate-800 border-slate-200",
        mastered: "border-emerald-200 bg-emerald-50 text-emerald-800 font-medium",
        developing: "border-amber-200 bg-amber-50 text-amber-800 font-medium",
        needs_attention: "border-red-200 bg-red-50 text-red-800 font-medium",
        not_started: "border-slate-200 bg-slate-50 text-slate-600 font-medium",
        hypothesis: "border-indigo-200 bg-indigo-50 text-indigo-800 font-medium",
        confirmed: "border-blue-200 bg-blue-50 text-blue-800 font-medium",
        resolved: "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium",
        ai_advisory: "border-purple-200 bg-purple-50 text-purple-800 text-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
