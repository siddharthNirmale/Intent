import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Spectrum UI inspired Sidebar component.
 * Minimalist navigation container with refined active states and clean borders.
 */
export const Sidebar = React.forwardRef(({ className, children, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(
      'flex flex-col w-full md:w-60 bg-zinc-50/80 rounded-2xl p-2.5 shrink-0',
      className
    )}
    {...props}
  >
    {children}
  </aside>
));
Sidebar.displayName = 'Sidebar';

export const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-1.5 px-3 py-2', className)}
    {...props}
  />
));
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto thin-scrollbar', className)}
    {...props}
  />
));
SidebarContent.displayName = 'SidebarContent';

export const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative flex w-full min-w-0 flex-col gap-1', className)}
    {...props}
  />
));
SidebarGroup.displayName = 'SidebarGroup';

export const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-7 shrink-0 items-center px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider select-none',
      className
    )}
    {...props}
  />
));
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

export const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('w-full', className)} {...props} />
));
SidebarGroupContent.displayName = 'SidebarGroupContent';

export const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex w-full min-w-0 flex-col gap-1', className)}
    {...props}
  />
));
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('relative list-none', className)} {...props} />
));
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef(
  ({ className, isActive, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        data-active={isActive}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 h-8 text-left text-xs transition-all duration-150 select-none outline-none cursor-pointer group',
          'active:scale-[0.98]',
          isActive
            ? 'bg-zinc-950 text-white shadow-2xs font-medium'
            : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-950 font-normal',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export const SidebarMenuBadge = React.forwardRef(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'ml-auto flex items-center justify-center text-[10px] font-medium leading-none',
      className
    )}
    {...props}
  />
));
SidebarMenuBadge.displayName = 'SidebarMenuBadge';

export const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('my-2 h-[1px] w-full bg-zinc-100', className)}
    {...props}
  />
));
SidebarSeparator.displayName = 'SidebarSeparator';

export const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-2 p-2 mt-auto', className)}
    {...props}
  />
));
SidebarFooter.displayName = 'SidebarFooter';

export default Sidebar;
