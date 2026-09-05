import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { ALL_ROLES } from '../../config/permissions';

export const LoginPage = () => {
  const [email, setEmail] = useState('sarah.jenkins@hrms.io');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const { login, switchRole } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully as Sarah Jenkins');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to log in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoRole = (role) => {
    switchRole(role);
    toast.info(`Switched demo login role to ${role}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mt-1">Enter your organization credentials below</p>
      </div>

      <Input
        label="Work Email"
        type="email"
        placeholder="name@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={Mail}
        isRequired
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={Lock}
        isRequired
      />

      <div className="flex items-center justify-between text-xs">
        <Checkbox
          label="Remember me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <Link
          to="/auth/forgot-password"
          className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-2"
        isLoading={isLoading}
        rightIcon={ArrowRight}
      >
        Sign In
      </Button>

      {/* Quick Demo Role Selector */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
          <span>Quick Demo Logins (RBAC Preview)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleQuickDemoRole(r)}
              className="px-2 py-1 text-[10px] font-medium bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded transition-colors text-slate-600"
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
};
