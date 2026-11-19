import { useState } from 'react';
import { Eye, EyeOff, Plus, KeyRound, Trash2, UserCog } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { FieldWrap, Input, Select } from '../ui/Field';
import { formatDate } from '../../lib/format';
import type { StaffUser } from '../../types';

function PasswordField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pr-10" />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function StaffAccountsPanel() {
  const users = useAuthStore((s) => s.users);
  const addStaff = useAuthStore((s) => s.addStaff);
  const updateStaff = useAuthStore((s) => s.updateStaff);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const deleteStaff = useAuthStore((s) => s.deleteStaff);
  const currentUser = useAuthStore((s) => s.currentUser());

  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [newPassword, setNewPassword] = useState('');

  async function submitAdd() {
    const res = await addStaff({ name, username, password, role });
    if (!res.ok) {
      setError(res.error ?? 'Could not add staff');
      return;
    }
    setName('');
    setUsername('');
    setPassword('');
    setRole('staff');
    setError('');
    setAddOpen(false);
  }

  return (
    <Card padded={false}>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Staff accounts</h2>
          <p className="text-xs text-ink-faint">Create logins for the people who work in your store.</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
          Add staff
        </Button>
      </div>

      <div className="divide-y divide-line">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white">
              {u.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink">{u.name}</p>
                <Badge tone={u.role === 'admin' ? 'violet' : 'blue'}>{u.role}</Badge>
                {!u.active && <Badge tone="gray">Deactivated</Badge>}
              </div>
              <p className="text-xs text-ink-faint">@{u.username} · joined {formatDate(u.createdAt)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" icon={<KeyRound size={13} />} onClick={() => setResetTarget(u)}>
                Reset password
              </Button>
              {u.id !== currentUser?.id && (
                <>
                  <Button size="sm" variant="subtle" icon={<UserCog size={13} />} onClick={() => updateStaff(u.id, { active: !u.active })}>
                    {u.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <button onClick={() => setDeleteTarget(u)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add staff account"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={submitAdd}>Create account</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FieldWrap label="Full name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FieldWrap>
          <FieldWrap label="Username" required>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </FieldWrap>
          <FieldWrap label="Password" required>
            <PasswordField value={password} onChange={setPassword} />
          </FieldWrap>
          <FieldWrap label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </Select>
          </FieldWrap>
          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={`Reset password — ${resetTarget?.name}`}
        footer={
          <Button
            onClick={async () => {
              if (resetTarget && newPassword) {
                await resetPassword(resetTarget.id, newPassword);
                setNewPassword('');
                setResetTarget(null);
              }
            }}
          >
            Update password
          </Button>
        }
      >
        <FieldWrap label="New password" required>
          <PasswordField value={newPassword} onChange={setNewPassword} placeholder="Minimum 4 characters" />
        </FieldWrap>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove staff account"
        message={`Remove ${deleteTarget?.name}'s account? They will no longer be able to sign in.`}
        confirmLabel="Remove"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteStaff(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </Card>
  );
}
