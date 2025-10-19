import * as React from 'react';

import { cn } from '~/lib/utils';

const Checkbox = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        'relative flex h-5 w-5 appearance-none items-center justify-center rounded-md border border-input bg-background shadow transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'checked:border-primary checked:bg-primary checked:bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 10\'%3E%3Cpath d=\'M4.5 7.4 1.8 4.7 0.7 5.8 4.5 9.6 11.3 2.8 10.2 1.7 4.5 7.4Z\' fill=\'white\'/%3E%3C/svg%3E")] checked:bg-no-repeat checked:bg-center',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
