import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PageShell from '../layouts/PageShell';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SectionHeader from '../components/ui/SectionHeader';
import { ConfirmationModal } from '../components/ConfirmationModal';

const Profile: React.FC = () => {
  const {
    currentUser,
    userProfile,
    updateUsername,
    updateAccountEmail,
    updateAccountPassword,
    deleteAccount,
    sendPasswordReset
  } = useAuth();

  const [username, setUsername] = useState(userProfile?.username || '');
  const [email, setEmail] = useState(userProfile?.email || currentUser?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isInternalEmail = email.endsWith('@personal-finance.app');

  useEffect(() => {
    setUsername(userProfile?.username || '');
    setEmail(userProfile?.email || currentUser?.email || '');
  }, [userProfile, currentUser]);

  const handleUsernameUpdate = async () => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      await updateUsername(username);
      setStatusMessage('Username updated successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update username');
    }
  };

  const handleEmailUpdate = async () => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      await updateAccountEmail(email, emailPassword);
      setStatusMessage('Email updated successfully.');
      setEmailPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update email');
    }
  };

  const handlePasswordUpdate = async () => {
    setStatusMessage('');
    setErrorMessage('');
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }
    try {
      await updateAccountPassword(currentPassword, newPassword);
      setStatusMessage('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password');
    }
  };

  const handleResetEmail = async () => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      await sendPasswordReset(email);
      setStatusMessage('Reset email sent. Check your inbox.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset email');
    }
  };

  const handleDeleteAccount = async () => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      await deleteAccount(deletePassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete account');
    }
  };

  return (
    <PageShell
      title="Profile & Settings"
      subtitle="Manage your account details, security, and connected data."
    >
      <div className="space-y-6">
        {isInternalEmail && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your account is still using a legacy internal email. Add a real email to enable password resets and email
            delivery.
          </div>
        )}
        {(statusMessage || errorMessage) && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${errorMessage ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {errorMessage || statusMessage}
          </div>
        )}

        <Card className="p-6">
          <SectionHeader title="Account Details" subtitle="Update your name and contact email." />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Password (to update email)</label>
              <Input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} className="mt-2" />
              {isInternalEmail && (
                <p className="text-xs text-slate-500 mt-2">
                  Add a real email to enable password resets and email delivery.
                </p>
              )}
            </div>
            <div className="text-xs text-slate-500 flex items-center">
              We’ll send a verification link to the new email before updating it.
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleUsernameUpdate}>Save username</Button>
            <Button variant="secondary" onClick={handleEmailUpdate}>Save email</Button>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader title="Security" subtitle="Change your password or send a reset link." />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Current password</label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">New password</label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Confirm new password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handlePasswordUpdate}>Update password</Button>
            <Button variant="ghost" onClick={handleResetEmail}>Send reset email</Button>
          </div>
        </Card>

        <Card className="p-6 border border-red-200 bg-red-50/40">
          <SectionHeader title="Danger Zone" subtitle="Deleting your account is permanent." />
          <div className="mt-4 max-w-md">
            <label className="text-sm font-semibold text-slate-700">Confirm password</label>
            <Input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="mt-2" />
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(true)}>
              Delete account
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeleteAccount();
        }}
        title="Delete account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </PageShell>
  );
};

export default Profile;
