import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200' };
    if (pwd.length < 6) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (pwd.length < 10) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculateStrength(password);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmError('');

    let isValid = true;
    if (!password) {
      setPasswordError('New password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 450);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Set new password</h2>
        <p className="text-xs text-slate-500 mt-1">Please enter your new password below</p>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <Alert variant="success" title="Password Updated">
            Your password has been reset successfully. You can now log in with your new credentials.
          </Alert>
          <Button variant="primary" className="w-full" onClick={() => navigate('/auth/login')}>
            Continue to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={Lock}
              isPasswordToggleable
              error={passwordError}
              isRequired
            />
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-transparent'} w-1/3`} />
                  <div className={`h-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-transparent'} w-1/3`} />
                  <div className={`h-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-transparent'} w-1/3`} />
                </div>
                <span className="text-[11px] font-medium text-slate-500">{strength.label}</span>
              </div>
            )}
          </div>

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={Lock}
            isPasswordToggleable
            error={confirmError}
            isRequired
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Update Password
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-orange-600 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
