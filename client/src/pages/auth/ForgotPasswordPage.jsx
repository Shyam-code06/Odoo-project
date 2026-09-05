import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Reset your password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your work email address and we'll send you instructions to reset your password.
        </p>
      </div>

      {submitted ? (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 leading-relaxed">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={Mail}
            isRequired
          />
          <Button type="submit" variant="primary" className="w-full">
            Send Reset Instructions
          </Button>
        </form>
      )}

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
