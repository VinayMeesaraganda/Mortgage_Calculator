import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../layouts/PageShell';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

const Signout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignout = async () => {
    setIsSigningOut(true);
    try {
      await logout();
      navigate('/login');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <PageShell title="Sign out" subtitle="Confirm you want to sign out of your account.">
      <Card className="p-6 max-w-md">
        <p className="text-sm text-slate-600">
          Signing out will end your current session. You can sign back in anytime.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSignout} disabled={isSigningOut}>
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </Button>
          <Button variant="secondary" onClick={() => navigate('/')}>Cancel</Button>
        </div>
      </Card>
    </PageShell>
  );
};

export default Signout;
