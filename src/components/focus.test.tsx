import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PrincipalType } from 'librechat-data-provider';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type * as t from '@/types';
import { EditCapabilitiesDialog } from './grants/EditCapabilitiesDialog';
import { ConfirmSaveDialog } from './configuration/ConfirmSaveDialog';
import { ImportYamlDialog } from './configuration/ImportYamlDialog';
import { CreateGroupDialog } from './access/CreateGroupDialog';
import { CreateRoleDialog } from './access/CreateRoleDialog';
import { EditGroupDialog } from './access/EditGroupDialog';
import { EditRoleDialog } from './access/EditRoleDialog';
import { defaultPermissions } from '@/constants';
import { FormDialog } from './shared/FormDialog';

vi.mock('@/hooks/useLocalize', () => ({
  default: () => (key: string) => key,
  useLocalize: () => (key: string) => key,
}));

vi.mock('@/server', async () => {
  const { defaultPermissions: permissions } = await import('@/constants');
  return {
    MEMBERS_PAGE_SIZE: 25,
    availableScopesOptions: { queryKey: ['availableScopes'], queryFn: async () => [] },
    roleQueryOptions: (id: string) => ({
      queryKey: ['role', id],
      queryFn: async () => ({
        id,
        name: 'Admins',
        description: '',
        permissions: permissions(),
      }),
    }),
    roleMembersQueryOptions: (id: string, page: number) => ({
      queryKey: ['roleMembers', id, page],
      queryFn: async () => ({ members: [], total: 0 }),
    }),
    groupMembersQueryOptions: (id: string, page: number) => ({
      queryKey: ['groupMembers', id, page],
      queryFn: async () => ({ members: [], total: 0 }),
    }),
    principalGrantsQueryOptions: (principalType: string, principalId: string) => ({
      queryKey: ['systemGrants', principalType, principalId],
      queryFn: async () => [],
    }),
    addGroupMemberFn: vi.fn(),
    addRoleMemberFn: vi.fn(),
    createGroupFn: vi.fn(),
    createRoleFn: vi.fn(),
    grantCapabilityFn: vi.fn(),
    parseImportedYaml: vi.fn(),
    removeGroupMemberFn: vi.fn(),
    removeRoleMemberFn: vi.fn(),
    revokeCapabilityFn: vi.fn(),
    searchUsersFn: vi.fn(),
    updateGroupFn: vi.fn(),
    updateRoleFn: vi.fn(),
    updateRolePermissionsFn: vi.fn(),
  };
});

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

const noop = () => {};

const testRole: t.Role = {
  id: 'role-1',
  name: 'Admins',
  description: '',
  isSystemRole: false,
  isActive: true,
  userCount: 0,
  permissions: defaultPermissions(),
};

const testGroup = {
  id: 'group-1',
  name: 'Engineers',
  description: '',
  memberCount: 0,
  topMembers: [],
  isActive: true,
};

interface FocusCase {
  name: string;
  renderDialog: (open: boolean, close: () => void) => ReactNode;
}

const cases: FocusCase[] = [
  {
    name: 'ImportYamlDialog',
    renderDialog: (open, close) => (
      <ImportYamlDialog
        open={open}
        onClose={close}
        onImport={noop}
        onImportAsProfile={async () => {}}
      />
    ),
  },
  {
    name: 'ConfirmSaveDialog',
    renderDialog: (open, close) => (
      <ConfirmSaveDialog
        open={open}
        editedValues={{ 'interface.customWelcome': 'hello' }}
        originalValues={{}}
        saving={false}
        onConfirm={noop}
        onCancel={close}
      />
    ),
  },
  {
    name: 'EditRoleDialog',
    renderDialog: (open, close) => (
      <EditRoleDialog role={open ? testRole : null} canManage onClose={close} />
    ),
  },
  {
    name: 'CreateRoleDialog',
    renderDialog: (open, close) => <CreateRoleDialog open={open} onClose={close} />,
  },
  {
    name: 'EditGroupDialog',
    renderDialog: (open, close) => (
      <EditGroupDialog group={open ? testGroup : null} canManage onClose={close} />
    ),
  },
  {
    name: 'CreateGroupDialog',
    renderDialog: (open, close) => <CreateGroupDialog open={open} onClose={close} />,
  },
  {
    name: 'FormDialog',
    renderDialog: (open, close) => (
      <FormDialog open={open} title="Test" submitLabel="Save" onSubmit={noop} onClose={close}>
        <div />
      </FormDialog>
    ),
  },
  {
    name: 'EditCapabilitiesDialog',
    renderDialog: (open, close) => (
      <EditCapabilitiesDialog
        principalType={open ? PrincipalType.ROLE : null}
        principalId={open ? 'role-1' : null}
        principalName="Admins"
        onClose={close}
      />
    ),
  },
];

function CaseHarness({ renderDialog }: { renderDialog: FocusCase['renderDialog'] }) {
  const [open, setOpen] = useState(false);
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <button type="button" onClick={() => setOpen(true)}>
        case trigger
      </button>
      {renderDialog(open, () => setOpen(false))}
    </QueryClientProvider>
  );
}

describe('dialog focus return', () => {
  it.each(cases)('$name returns focus to the trigger on close', async ({ renderDialog }) => {
    render(<CaseHarness renderDialog={renderDialog} />);
    const trigger = screen.getByRole('button', { name: 'case trigger' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
