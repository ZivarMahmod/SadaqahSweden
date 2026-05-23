// Designsystem-primitiv — EmptyState (tomt-tillstånd).
// Designreferens: handoff-to-code/byggplan.html § Tillståndsmatriser (tomt-state).
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="card card-bare text-center py-16 px-8 flex flex-col items-center gap-4">
      {icon && <div className="text-[var(--color-copper)]">{icon}</div>}
      <h3 className="h-3">{title}</h3>
      {description && <p className="lead max-w-md mx-auto" style={{ fontSize: 16 }}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
