import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, UserPlus, UserMinus, RotateCcw, Trash2, Eye } from 'lucide-react';
import { useFreelancers } from '../../contexts/FreelancerContext';
import { usePlatforms } from '../../contexts/PlatformContext';
import { FreelancerOnboardingForm } from './FreelancerOnboardingForm';
import { OnboardingProgressTracker } from './OnboardingProgressTracker';

interface FreelancerManagementDashboardProps {
  className?: string;
}

export function FreelancerManagementDashboard({ className = '' }: FreelancerManagementDashboardProps) {
  const { 
    freelancers, 
    loading, 
    deleteFreelancer, 
    bulkOnboardFreelancers,
    bulkDeactivateFreelancers,
    bulkReactivateFreelancers,
    getFreelancerPlatforms
  } = useFreelancers();
  const { platforms } = usePlatforms();
  
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [selectedFreelancers, setSelectedFreelancers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showProgressFor, setShowProgressFor] = useState<string | null>(null);

  const filteredFreelancers = freelancers.filter(freelancer => {
    const matchesSearch = 
      freelancer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

      <div className="overflow-x-auto">
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
                          {freelancer.full_name}
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
                      <button
                        onClick={() => setShowProgressFor(
                          showProgressFor === freelancer.id ? null : freelancer.id
                        )}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
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
    </div>
  );
}