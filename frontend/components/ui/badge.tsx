import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900",
        secondary: "border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
        destructive: "border-transparent bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
        outline: "text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50",
        mastered: "border-emerald-200 bg-emerald-50 text-emerald-800 font-medium dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300",
        developing: "border-amber-200 bg-amber-50 text-amber-800 font-medium dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300",
        needs_attention: "border-red-200 bg-red-50 text-red-800 font-medium dark:bg-red-950/60 dark:border-red-800 dark:text-red-300",
        not_started: "border-slate-200 bg-slate-50 text-slate-600 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300",
        hypothesis: "border-indigo-200 bg-indigo-50 text-indigo-800 font-medium dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300",
        confirmed: "border-blue-200 bg-blue-50 text-blue-800 font-medium dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300",
        resolved: "border-emerald-200 bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300",
        ai_advisory: "border-purple-200 bg-purple-50 text-purple-800 text-[11px] dark:bg-purple-950/60 dark:border-purple-800 dark:text-purple-300",
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
