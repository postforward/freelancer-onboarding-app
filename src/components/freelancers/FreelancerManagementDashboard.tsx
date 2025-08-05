import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, UserPlus, UserMinus, RotateCcw, Trash2, Eye, Edit, Mail, Phone, Settings } from 'lucide-react';
import { useFreelancers, getFreelancerFullName } from '../../contexts/FreelancerContext';
import { usePlatforms } from '../../contexts/PlatformContext';
import { usePermissions } from '../../hooks/usePermissions';
import { FreelancerOnboardingForm } from './FreelancerOnboardingForm';
import { OnboardingProgressTracker } from './OnboardingProgressTracker';
import { FreelancerEditModal } from './FreelancerEditModal';
import { FreelancerPlatformModal } from './FreelancerPlatformModal';

interface FreelancerManagementDashboardProps {
  className?: string;
}

export function FreelancerManagementDashboard({ className = '' }: FreelancerManagementDashboardProps) {
  const { 
    freelancers, 
    loading, 
    deleteFreelancer, 
    bulkDeactivateFreelancers,
    bulkReactivateFreelancers,
    getFreelancerPlatforms
  } = useFreelancers();
  const { platforms, platformStatuses, platformConfigs } = usePlatforms();
  const { canManagePlatforms } = usePermissions();
  
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showProgressFor, setShowProgressFor] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingFreelancer, setEditingFreelancer] = useState<string | null>(null);
  const [managingPlatformsFor, setManagingPlatformsFor] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [dropdownPositions, setDropdownPositions] = useState<{ [key: string]: 'up' | 'down' }>({});

  // Handle clicking outside of dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && dropdownRefs.current[openDropdownId]) {
        const dropdown = dropdownRefs.current[openDropdownId];
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const filteredFreelancers = freelancers.filter(freelancer => {
    const fullName = getFreelancerFullName(freelancer);
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      freelancer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || freelancer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedFreelancers.length === filteredFreelancers.length) {
      setSelectedFreelancers([]);
    } else {
      setSelectedFreelancers(filteredFreelancers.map(f => f.id));
    }
  };

  const handleSelectFreelancer = (freelancerId: string) => {
    setSelectedFreelancers(prev => 
      prev.includes(freelancerId)
        ? prev.filter(id => id !== freelancerId)
        : [...prev, freelancerId]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedFreelancers.length === 0) return;

    try {
      switch (action) {
        case 'deactivate':
          await bulkDeactivateFreelancers(selectedFreelancers);
          break;
        case 'reactivate':
          await bulkReactivateFreelancers(selectedFreelancers);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedFreelancers.length} freelancer(s)?`)) {
            for (const id of selectedFreelancers) {
              await deleteFreelancer(id);
            }
          }
          break;
      }
      setSelectedFreelancers([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformStats = (freelancerId: string) => {
    const platforms = getFreelancerPlatforms(freelancerId);
    const active = platforms.filter(p => p.status === 'active').length;
    const failed = platforms.filter(p => p.status === 'failed').length;
    const total = platforms.length;
    
    return { active, failed, total };
  };

  const getStatusDot = (status: any, config: any) => {
    if (!config) {
      return <div className="w-2 h-2 rounded-full bg-gray-400" />;
    }
    if (!status?.enabled) {
      return <div className="w-2 h-2 rounded-full bg-blue-500" />;
    }
    if (status.connected) {
      return <div className="w-2 h-2 rounded-full bg-green-500" />;
    }
    if (status.error) {
      return <div className="w-2 h-2 rounded-full bg-red-500" />;
    }
    return <div className="w-2 h-2 rounded-full bg-orange-500" />;
  };

  const getStatusText = (status: any, config: any) => {
    if (!config) return 'Not Configured';
    if (!status?.enabled) return 'Configured';
    if (status.connected) return 'Connected';
    if (status.error) return 'Error';
    return 'Enabled';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Freelancer Management</h2>
            <p className="text-sm text-gray-600">Manage freelancers and their platform access</p>
          </div>
          <button
            onClick={() => setShowOnboardingForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Freelancer
          </button>
        </div>

        {/* Platform Status for Members */}
        {!canManagePlatforms() && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-3">Platform Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from(platforms.entries()).map(([platformId, platformInfo]) => {
                const status = platformStatuses.get(platformId);
                const config = platformConfigs.find(c => c.platform_id === platformId);
                
                return (
                  <div key={platformId} className="flex items-center space-x-2">
                    {getStatusDot(status, config)}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-blue-800 truncate">
                        {platformInfo?.metadata?.name || platformId}
                      </div>
                      <div className="text-xs text-blue-600">
                        {getStatusText(status, config)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search freelancers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
          </select>

          {selectedFreelancers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedFreelancers.length} selected
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleBulkAction('reactivate')}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                  title="Reactivate selected"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-md"
                  title="Deactivate selected"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  title="Delete selected"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto pb-4" style={{ position: 'relative', zIndex: 1 }}>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedFreelancers.length === filteredFreelancers.length && filteredFreelancers.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Freelancer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platforms
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFreelancers.map((freelancer) => {
              const platformStats = getPlatformStats(freelancer.id);
              
              return (
                <React.Fragment key={freelancer.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedFreelancers.includes(freelancer.id)}
                        onChange={() => handleSelectFreelancer(freelancer.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getFreelancerFullName(freelancer)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {freelancer.email}
                        </div>
                        {freelancer.phone && (
                          <div className="text-xs text-gray-400">
                            {freelancer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(freelancer.status)}`}>
                        {freelancer.status.charAt(0).toUpperCase() + freelancer.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {platformStats.active}/{platformStats.total} active
                      </div>
                      {platformStats.failed > 0 && (
                        <div className="text-xs text-red-600">
                          {platformStats.failed} failed
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(freelancer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setShowProgressFor(
                            showProgressFor === freelancer.id ? null : freelancer.id
                          )}
                          className="text-blue-600 hover:text-blue-900"
                          title="View platform details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <div className="relative" ref={el => { if (el) dropdownRefs.current[freelancer.id] = el; }}>
                          <button
                            onClick={(e) => {
                              if (openDropdownId === freelancer.id) {
                                setOpenDropdownId(null);
                              } else {
                                // Check if we're near the bottom of the viewport
                                const rect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const spaceAbove = rect.top;
                                
                                // Position dropdown upward if there's more space above or less than 200px below
                                const position = (spaceBelow < 200 && spaceAbove > spaceBelow) ? 'up' : 'down';
                                setDropdownPositions(prev => ({ ...prev, [freelancer.id]: position }));
                                setOpenDropdownId(freelancer.id);
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          {openDropdownId === freelancer.id && (
                            <div 
                              className={`absolute right-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 max-h-60 overflow-y-auto ${
                                dropdownPositions[freelancer.id] === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
                              }`}
                              style={{ zIndex: 9999 }}
                            >
                              <div className="py-1" role="menu">
                                <button
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => {
                                    setEditingFreelancer(freelancer.id);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Details
                                </button>
                                
                                <button
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => {
                                    setManagingPlatformsFor(freelancer.id);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  Manage Platforms
                                </button>
                                
                                <button
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => {
                                    // TODO: Implement resend invite functionality
                                    console.log('Resend invites:', freelancer.id);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Resend Invites
                                </button>
                                
                                <button
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  onClick={() => {
                                    // TODO: Implement contact functionality
                                    console.log('Contact freelancer:', freelancer.id);
                                    setOpenDropdownId(null);
                                  }}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Contact
                                </button>
                                
                                <hr className="my-1" />
                                
                                {freelancer.status === 'active' ? (
                                  <button
                                    className="flex items-center w-full px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                                    onClick={async () => {
                                      await bulkDeactivateFreelancers([freelancer.id]);
                                      setOpenDropdownId(null);
                                    }}
                                  >
                                    <UserMinus className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </button>
                                ) : (
                                  <button
                                    className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                                    onClick={async () => {
                                      await bulkReactivateFreelancers([freelancer.id]);
                                      setOpenDropdownId(null);
                                    }}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reactivate
                                  </button>
                                )}
                                
                                <button
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete ${getFreelancerFullName(freelancer)}?`)) {
                                      await deleteFreelancer(freelancer.id);
                                      setOpenDropdownId(null);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {showProgressFor === freelancer.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <OnboardingProgressTracker freelancerId={freelancer.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        {filteredFreelancers.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">No freelancers found</div>
            <div className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'No freelancers match your current filters.'
                : 'Get started by adding your first freelancer.'
              }
            </div>
            <button
              onClick={() => setShowOnboardingForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Freelancer
            </button>
          </div>
        )}
      </div>

      {showOnboardingForm && (
        <FreelancerOnboardingForm
          onClose={() => setShowOnboardingForm(false)}
          onSuccess={() => {
            setShowOnboardingForm(false);
          }}
        />
      )}

      {editingFreelancer && (
        <FreelancerEditModal
          freelancer={freelancers.find(f => f.id === editingFreelancer)!}
          isOpen={!!editingFreelancer}
          onClose={() => setEditingFreelancer(null)}
        />
      )}

      {managingPlatformsFor && (
        <FreelancerPlatformModal
          freelancer={freelancers.find(f => f.id === managingPlatformsFor)!}
          isOpen={!!managingPlatformsFor}
          onClose={() => setManagingPlatformsFor(null)}
        />
      )}
    </div>
  );
}