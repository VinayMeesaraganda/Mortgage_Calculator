// Login and Signup Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { INPUT_STYLE } from '../constants/styles';
import PageShell from '../layouts/PageShell';
import Card from '../components/ui/Card';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const { login, signup, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!identifier || !password) {
      setError('Please fill in all required fields');
      return;
    }

    // Username validation only when user enters a username (not email)
    if (!identifier.includes('@')) {
      if (identifier.trim().length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }
      const usernameRegex = /^[a-zA-Z0-9_-]+$/;
      if (!usernameRegex.test(identifier.trim())) {
        setError('Username can only contain letters, numbers, underscores, and hyphens');
        return;
      }
    }

    // Password validation for signup
    if (!isLogin) {
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(identifier.trim(), password);
        navigate('/');
      } else {
        await signup(identifier.trim(), email.trim(), password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setIdentifier('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowReset(false);
    setResetIdentifier('');
    setResetMessage('');
  };

  const handlePasswordReset = async () => {
    setError('');
    setResetMessage('');
    try {
      await sendPasswordReset(resetIdentifier.trim());
      setResetMessage('Reset link sent. Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    }
  };

  return (
    <PageShell
      title={isLogin ? 'Welcome back' : 'Create your account'}
      subtitle={isLogin ? 'Sign in to continue managing your financial tools.' : 'Create a secure profile to save and sync your data.'}
    >
      <div className="w-full max-w-md mx-auto">
        <Card variant="elevated" className="p-8">
            {/* Toggle between Login and Signup */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={toggleMode}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  isLogin
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <LogIn className="w-4 h-4 inline mr-2" />
                Login
              </button>
              <button
                onClick={toggleMode}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  !isLogin
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username or Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                {isLogin ? 'Username or Email' : 'Username'}
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isLogin ? 'Enter your username or email' : 'Choose a username'}
                className={INPUT_STYLE}
                required
                pattern={isLogin ? undefined : "[a-zA-Z0-9_-]+"}
                title={isLogin ? undefined : "Username can only contain letters, numbers, underscores, and hyphens"}
              />
              {!isLogin && (
                <p className="text-xs text-slate-500 mt-1">3+ characters, letters, numbers, _, - only</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT_STYLE}
                  required={!isLogin}
                />
              </div>
            )}

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={INPUT_STYLE}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-slate-500 mt-1">Password must be at least 6 characters</p>
                )}
              </div>

              {isLogin && (
              <button
                type="button"
                onClick={() => setShowReset((prev) => !prev)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 text-left"
              >
                Forgot password?
              </button>
              )}

              {/* Confirm Password (Signup only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className={INPUT_STYLE}
                      required={!isLogin}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

            {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isLogin ? 'Logging in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        Login
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Sign Up
                      </>
                    )}
                  </>
                )}
              </button>
            </form>

            {isLogin && showReset && (
              <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-600 mb-2">Send a reset link to your account email.</p>
                <input
                  type="email"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  className={INPUT_STYLE}
                />
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="mt-3 w-full px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                >
                  Send reset link
                </button>
                {resetMessage && <p className="text-xs text-emerald-600 mt-2">{resetMessage}</p>}
              </div>
            )}

            {/* Security Note */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 text-center">
                <Lock className="w-3 h-3 inline mr-1" />
                Your data is securely encrypted and protected
              </p>
            </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-600">
          <p className="text-xs">
            Secure authentication powered by Firebase
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default Login;
