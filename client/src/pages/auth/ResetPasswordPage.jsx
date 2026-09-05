import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Set new password</h2>
        <p className="text-xs text-slate-500 mt-1">Please enter your new password below</p>
      </div>

      <form className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={Lock}
          isRequired
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={Lock}
          isRequired
        />
        <Button type="submit" variant="primary" className="w-full">
          Reset Password
        </Button>
      </form>

      <div className="text-center pt-2">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-orange-600 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </div>
    </div>
  );
};
