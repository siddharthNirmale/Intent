import React from 'react';
import { cn } from '../../lib/utils';

export const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-950/10 bg-zinc-100',
      className
    )}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

export const AvatarImage = React.forwardRef(({ className, src, alt, ...props }, ref) => {
  if (!src) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt={alt || 'Avatar'}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 select-none',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
AvatarFallback.displayName = 'AvatarFallback';

export default Avatar;
