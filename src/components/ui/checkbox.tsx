import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & { onCheckedChange?: (checked: boolean) => void }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
    <div
        className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center cursor-pointer",
            checked ? "bg-primary text-primary-foreground" : "bg-transparent",
            className
        )}
        onClick={() => onCheckedChange?.(!checked)}
    >
        {checked && <Check className="h-3 w-3" />}
        <input
            type="checkbox"
            ref={ref}
            checked={checked}
            className="sr-only"
            onChange={(e) => onCheckedChange?.(e.target.checked)}
            {...props}
        />
    </div>
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
