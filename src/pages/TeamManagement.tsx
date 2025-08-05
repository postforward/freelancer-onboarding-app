
import { UserManagement } from '../components/users/UserManagement';

export function TeamManagement() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage team members, roles, and permissions for your organization
            </p>
          </div>
          <UserManagement />
        </div>
      </div>
    </div>
  );
}