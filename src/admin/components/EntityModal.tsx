import { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function EntityModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes: Record<string, string> = {
    sm: "sm:max-w-md",
    md: "sm:max-w-xl",
    lg: "sm:max-w-2xl",
    xl: "sm:max-w-4xl",
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`p-0 ${sizes[size]} max-h-[92vh] overflow-hidden flex flex-col bg-card text-card-foreground border-[hsl(var(--admin-border))] shadow-2xl`}>
        <DialogHeader className="border-b border-[hsl(var(--admin-border))] bg-card px-6 py-4 space-y-1 pr-12">
          <DialogTitle className="text-[17px] font-semibold tracking-tight">{title}</DialogTitle>
          {description && <DialogDescription className="text-xs leading-relaxed">{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-card px-6 py-5">{children}</div>
        {footer && <div className="border-t border-[hsl(var(--admin-border))] px-6 py-3.5 bg-muted/30">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
