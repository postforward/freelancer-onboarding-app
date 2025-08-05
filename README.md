# Freelancer Hub

A comprehensive freelancer management platform that streamlines onboarding, platform integration, and team collaboration.

## Features

### 🚀 **Freelancer Management**
- **Onboard New Freelancers**: Streamlined form to add freelancers with platform selection
- **Manage Freelancer Database**: View, edit, and track freelancer status and platform access
- **Platform Integration**: Automatically provision freelancers across multiple platforms
- **Progress Tracking**: Monitor onboarding status and platform connectivity

### 🔧 **Platform Management** 
- **Multi-Platform Support**: Integrate with Monday.com, Upwork, Fiverr, and more
- **Configuration Management**: Secure API key and credential storage
- **Connection Testing**: Real-time platform connectivity verification
- **Bulk Operations**: Enable/disable multiple platforms simultaneously

### 👥 **Team Management**
- **Role-Based Access Control**: Admin, Member, and Owner permission levels
- **User Management**: Add, edit, and remove team members
- **Permission System**: Granular control over feature access
- **Organization Context**: Multi-tenant support with organization isolation

### ⚙️ **Settings & Configuration**
- **Organization Settings**: Configure company details and preferences
- **Notification Management**: Control email and SMS alert preferences
- **Security Settings**: Two-factor authentication and session management
- **API Configuration**: Rate limiting and webhook management

### 🎨 **Branding & Customization**
- **Custom Branding**: Upload logos and set brand colors
- **Theme Selection**: Multiple font and color scheme options
- **Dynamic Titles**: Organization-specific page titles and navigation

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router v6
- **State Management**: React Context API
- **Mock Backend**: Supabase-compatible mock layer
- **Development**: Hot Module Replacement (HMR)

## Architecture

### **Context-Driven Architecture**
- **AuthContext**: User authentication and session management
- **TenantContext**: Organization and multi-tenant support
- **PlatformContext**: Platform configurations and status
- **FreelancerContext**: Freelancer data and operations
- **BrandingContext**: Customization and theming

### **Permission System**
```typescript
// Role-based permissions
admin: ['platforms.manage', 'users.manage', 'settings.update']
member: ['freelancers.manage', 'platforms.read']
owner: ['*'] // Full access
```

### **Mock Data Layer**
- Supabase-compatible API simulation
- Real-time subscription simulation
- Persistent session data
- Development-friendly test data

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd freelancer-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
# Start development server with HMR
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Run type checking
npm run type-check
```

## User Roles & Permissions

### **Owner**
- Full system access
- Manage all users and settings
- Platform configuration
- Billing and subscription management

### **Admin** 
- User management (add/remove team members)
- Platform configuration and API settings
- All freelancer operations
- System settings

### **Member**
- Freelancer management (add/edit/remove)
- View platform status
- Basic notifications
- Limited settings access

## Demo Mode

The application includes a comprehensive demo mode with:
- **Role Switching**: Test different permission levels
- **Mock Data**: Pre-populated freelancers and platforms
- **Real-time Updates**: Simulated platform connections
- **Interactive Features**: Full CRUD operations

### Testing Different Roles

1. Go to Settings page
2. Use the "Role Testing" switcher
3. Switch between Sarah Johnson (Admin) and David Wilson (Member)
4. Observe different UI permissions and access levels

## Key Components

### **Navigation System**
- Role-based menu items
- Responsive mobile navigation
- Dynamic branding integration
- User context display

### **Platform Status Tracking**
- Real-time connection monitoring
- Visual status indicators (colored dots)
- Bulk platform operations
- Configuration validation

### **Freelancer Operations**
- Bulk onboarding workflows
- Individual platform access toggles
- Progress tracking and status updates
- Error handling and retry mechanisms

## Configuration

### **Environment Variables**
```env
# Add to .env.local for custom configuration
VITE_APP_NAME="Your Company Name"
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### **Mock Mode**
The application runs in mock mode by default for development. To enable real Supabase:
1. Configure environment variables
2. Update `src/services/supabase.ts`
3. Replace mock data with real API calls

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── freelancers/    # Freelancer management
│   ├── platforms/      # Platform integration
│   ├── users/          # Team management
│   └── layout/         # Navigation and layout
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── mock/               # Mock data and API simulation
├── pages/              # Route components
├── services/           # API and external services
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in `/docs`
- Review the demo mode for feature examples