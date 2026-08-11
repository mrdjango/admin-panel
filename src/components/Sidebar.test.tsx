import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, className, children }: { to: string; className?: string; children: ReactNode }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useRouter: () => ({
    state: { location: { pathname: '/' } },
    invalidate: vi.fn(),
    navigate: vi.fn(),
  }),
}));

vi.mock('@clickhouse/click-ui', () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
  Dropdown: Object.assign(({ children }: { children: ReactNode }) => <div>{children}</div>, {
    Trigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Content: () => null,
    Item: () => null,
  }),
}));

vi.mock('@/hooks', () => ({
  useLocalize: () => (key: string) => key,
  useCapabilities: () => ({ hasCapability: () => true }),
  useStripAriaExpanded: () => ({ current: null }),
}));

vi.mock('@/server', () => ({ adminLogoutFn: vi.fn() }));

vi.mock('./SettingsDialog', () => ({ SettingsDialog: () => null }));

const user = { name: 'Ada Lovelace', email: 'ada@example.com' };

const renderSidebar = (collapsed: boolean) =>
  render(<Sidebar user={user} collapsed={collapsed} onToggle={() => {}} />);

describe('Sidebar', () => {
  it('centers the logo, nav icons, and avatar with no gap when collapsed', () => {
    const { container } = renderSidebar(true);
    const logoRow = container.querySelector('img')?.parentElement;
    expect(logoRow).toHaveClass('justify-center', 'gap-0');
    expect(logoRow).not.toHaveClass('gap-2.5');
    const link = container.querySelector('a[href="/"]');
    expect(link).toHaveClass('justify-center', 'gap-0');
    expect(link).not.toHaveClass('gap-2.5');
    const userRow = container.querySelector('div.border-t')?.firstElementChild;
    expect(userRow).toHaveClass('justify-center', 'gap-0');
    expect(userRow).not.toHaveClass('overflow-hidden');
  });

  it('restores gaps and left alignment when expanded', () => {
    const { container } = renderSidebar(false);
    const link = container.querySelector('a[href="/"]');
    expect(link).toHaveClass('gap-2.5');
    expect(link).not.toHaveClass('justify-center');
    const userRow = container.querySelector('div.border-t')?.firstElementChild;
    expect(userRow).toHaveClass('gap-2.5');
    expect(userRow).not.toHaveClass('overflow-hidden');
  });

  it('applies the sidebar-toggle class to the collapse toggle', () => {
    const { getByLabelText } = renderSidebar(true);
    expect(getByLabelText('com_nav_expand_sidebar')).toHaveClass('sidebar-toggle');
  });
});
