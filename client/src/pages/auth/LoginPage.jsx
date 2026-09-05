import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('admin123');
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
        toast.success(`Welcome back, ${res.user.name || 'Admin'}!`);
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
          placeholder="admin@gmail.com"
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
    </div>
  );
};

export default LoginPage;
