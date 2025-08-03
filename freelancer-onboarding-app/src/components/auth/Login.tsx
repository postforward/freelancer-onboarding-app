import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Mail, Lock, Loader2, LogIn, UserPlus } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface SignupFormData extends LoginFormData {
  fullName: string;
  organizationName?: string;
}

export const Login: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { signIn, signUp, authUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/';
  
  useEffect(() => {
    if (authUser) {
      navigate(from, { replace: true });
    }
  }, [authUser, navigate, from]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      if (isSignup) {
        const result = await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.organizationName || undefined
        );
        
        if (result.success) {
          setSuccess('Account created successfully! Please check your email to verify your account.');
          setFormData({
            email: '',
            password: '',
            fullName: '',
            organizationName: '',
          });
        } else {
          setError(result.error || 'Failed to create account');
        }
      } else {
        const result = await signIn(formData.email, formData.password);
        
        if (!result.success) {
          setError(result.error || 'Failed to sign in');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignup ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
              setSuccess(null);
            }}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isSignup ? 'sign in to your existing account' : 'create a new account'}
          </button>
        </p>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              <span className="text-sm">{success}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                />
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            
            {isSignup && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <div className="mt-1">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">
                    Organization name{' '}
                    <span className="text-gray-500 font-normal">(optional - create a new organization)</span>
                  </label>
                  <div className="mt-1">
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty if joining an existing organization
                  </p>
                </div>
              </>
            )}
            
            {!isSignup && (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isSignup ? (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Create account
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign in
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};