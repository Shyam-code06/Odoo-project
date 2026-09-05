import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { MOCK_USERS, DEFAULT_DEMO_PASSWORD } from '../../mocks/authData';
import { ROLES } from '../../config/permissions';

export const LoginPage = () => {
  const [email, setEmail] = useState('hrmanager@hrms.demo');
  const [password, setPassword] = useState(DEFAULT_DEMO_PASSWORD);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setErrorMsg('');

    if (!email || !email.trim()) {
      setEmailError('Email is required.');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Enter a valid email address.');
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await login(email, password);
      if (res.success) {
        toast.success(`Welcome back, ${res.user.name}!`);
        navigate('/dashboard');
      } else {
        setErrorMsg(res.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoAccount = (userKey) => {
    const demoUser = MOCK_USERS[userKey];
    if (demoUser) {
      setEmail(demoUser.email);
      setPassword(DEFAULT_DEMO_PASSWORD);
      setEmailError('');
      setPasswordError('');
      setErrorMsg('');
      toast.info(`Filled credentials for ${demoUser.name} (${demoUser.role})`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="text-xs text-slate-500 mt-1">Enter your organization credentials below</p>
      </div>

      {errorMsg && (
        <Alert variant="error" title="Authentication Error" isDismissible>
          {errorMsg}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          label="Work Email"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={Mail}
          error={emailError}
          isRequired
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={Lock}
          isPasswordToggleable
          error={passwordError}
          isRequired
        />

        <div className="flex items-center justify-between text-xs pt-1">
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
      </form>

      {/* Demo Accounts Panel */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
          <span>Demo Accounts (Click to autofill role)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {Object.entries(MOCK_USERS).map(([key, u]) => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleSelectDemoAccount(key)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-left rounded-lg bg-slate-50 hover:bg-orange-50/70 border border-slate-200 hover:border-orange-200 transition-colors group cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-800 group-hover:text-orange-600 truncate">
                  {u.role}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{u.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
