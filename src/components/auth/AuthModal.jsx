import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseAuthAdapter } from '@/services/firebaseAuthAdapter';

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }) {
  const [tab, setTab] = useState(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      setLoading(false); // Stop loading immediately
      setSuccess('Login successful!');
      const returnUrl = firebaseAuthAdapter.getReturnUrl();
      if (returnUrl) {
        firebaseAuthAdapter.clearReturnUrl();
        navigate(returnUrl, { replace: true });
      }
      setTimeout(() => {
        onClose();
        resetForm();
      }, 500);
    } catch (err) {
      setLoading(false); // Stop loading on error
      setError(err.message || 'Failed to login');
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !fullName) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    console.log('Modal: Starting signup process...');
    setLoading(true);
    try {
      console.log('Modal: Calling signup function...');
      await signup(email, password, fullName);
      console.log('Modal: Signup function returned');
      setLoading(false); // Stop loading immediately
      console.log('Modal: Loading stopped');
      setSuccess('Account created successfully!');
      const returnUrl = firebaseAuthAdapter.getReturnUrl();
      if (returnUrl) {
        firebaseAuthAdapter.clearReturnUrl();
        navigate(returnUrl, { replace: true });
      }
      console.log('Modal: Success message set');
      setTimeout(() => {
        console.log('Modal: Closing modal...');
        onClose();
        resetForm();
      }, 500);
    } catch (err) {
      console.error('Modal: Signup error:', err);
      setLoading(false); // Stop loading on error
      setError(err.message || 'Failed to create account');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setError('');
    setSuccess('');
    setLoading(false);
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold'>
            {tab === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {tab === 'login' ? 'Login to access your account' : 'Sign up to start exploring'}
          </DialogDescription>
        </DialogHeader>

        <div className='flex gap-2 mb-4'>
          <Button
            variant={tab === 'login' ? 'default' : 'outline'}
            onClick={() => switchTab('login')}
            className='flex-1'
          >
            Login
          </Button>
          <Button
            variant={tab === 'signup' ? 'default' : 'outline'}
            onClick={() => switchTab('signup')}
            className='flex-1'
          >
            Sign Up
          </Button>
        </div>

        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className='border-green-500 bg-green-50'>
            <AlertDescription className='text-green-700'>{success}</AlertDescription>
          </Alert>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='login-email'>Email</Label>
              <Input
                id='login-email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='login-password'>Password</Label>
              <Input
                id='login-password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='signup-name'>Full Name</Label>
              <Input
                id='signup-name'
                type='text'
                placeholder='John Doe'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='signup-email'>Email</Label>
              <Input
                id='signup-email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='signup-password'>Password</Label>
              <Input
                id='signup-password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='signup-confirm-password'>Confirm Password</Label>
              <Input
                id='signup-confirm-password'
                type='password'
                placeholder='••••••••'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
