import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { useBranding } from '../../contexts/BrandingContext';
import { usePermissions } from '../../hooks/usePermissions';
import { getUserFullName } from '../../types/database.types';
import { 
  UserPlus, 
  Users, 
  Settings, 
  Palette, 
  LogOut, 
  Building2,
  Menu,
  X,
  ChevronDown,
  Server,
  UsersRound
} from 'lucide-react';

interface NavigationProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  onMenuToggle, 
  isMobileMenuOpen = false 
}) => {
  const { dbUser, signOut } = useAuth();
  const { organization } = useTenant();
  const { branding } = useBranding();
  const { canUpdateSettings, canManageUsers } = usePermissions();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  
  // Use branding company name if available, otherwise fallback to organization name
  const displayName = branding.companyName || organization?.name || 'Freelancer Hub';
  
  const navItems = [
    {
      name: 'Onboard',
      path: '/onboard',
      icon: UserPlus,
      description: 'Add new freelancers',
    },
    {
      name: 'Manage',
      path: '/manage',
      icon: Users,
      description: 'Manage freelancers',
    },
    {
      name: 'Platforms',
      path: '/platforms',
      icon: Server,
      description: 'Manage integrations',
      requiresPermission: canUpdateSettings(),
    },
    {
      name: 'Team',
      path: '/team',
      icon: UsersRound,
      description: 'Manage team members',
      requiresPermission: canManageUsers(),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      description: 'Platform configuration',
      requiresPermission: canUpdateSettings(),
    },
    {
      name: 'Branding',
      path: '/branding',
      icon: Palette,
      description: 'Customize appearance',
      requiresPermission: canUpdateSettings(),
    },
  ].filter(item => item.requiresPermission !== false);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };
  
  const NavItem = ({ item, mobile = false }: { item: typeof navItems[0], mobile?: boolean }) => (
    <NavLink
      to={item.path}
      onClick={mobile ? onMenuToggle : undefined}
      className={({ isActive }) => `
        ${mobile ? 'block' : 'inline-flex items-center'}
        px-3 py-2 rounded-md text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-indigo-700 text-white' 
          : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
        }
      `}
    >
      <item.icon className={`${mobile ? 'inline-block' : ''} h-5 w-5 mr-2`} />
      <span>{item.name}</span>
      {mobile && (
        <span className="block text-xs mt-1 text-indigo-200">{item.description}</span>
      )}
    </NavLink>
  );
  
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo/Organization */}
              <div className="flex-shrink-0 flex items-center">
                <Link 
                  to="/dashboard" 
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  {branding.logoUrl ? (
                    <img 
                      src={branding.logoUrl} 
                      alt={displayName} 
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-white" />
                  )}
                  <div className="ml-2">
                    <span className="text-white font-semibold text-lg">
                      {displayName}
                    </span>
                    {branding.tagline && (
                      <div className="text-xs text-indigo-200">
                        {branding.tagline}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
              
              {/* Desktop Nav Items */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-2 sm:items-center">
                {navItems.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            </div>
            
            {/* User Menu */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center text-sm rounded-full text-white hover:bg-indigo-700 px-3 py-2 transition-colors"
                >
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium">{dbUser ? getUserFullName(dbUser) : ''}</p>
                    <p className="text-xs text-indigo-200">{dbUser?.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={onMenuToggle}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-indigo-600">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.path} item={item} mobile />
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-700">
            <div className="px-4 mb-3">
              <p className="text-base font-medium text-white">{dbUser ? getUserFullName(dbUser) : ''}</p>
              <p className="text-sm text-indigo-200">{dbUser?.email}</p>
              <p className="text-xs text-indigo-300 mt-1">Role: {dbUser?.role}</p>
            </div>
            <div className="px-2">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-white hover:bg-indigo-700 rounded-md"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};