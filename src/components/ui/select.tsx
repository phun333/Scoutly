import * as React from 'react';
import { cn } from '~/lib/utils';

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        'bg-[url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNkQ3NThCIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgZmlsbD0iI0ZGRiIvPgo8L3N2Zz4=)] bg-[length:12px_8px] bg-[position:calc(100%-0.75rem)_center] bg-no-repeat pr-8',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
