# Development Setup Guide

This project includes comprehensive mock data and services for local development, allowing you to work on the UI without needing a real database or external APIs.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Login with Mock Credentials**
   - Email: `admin@techflow.com`
   - Password: `password`

## Mock Data Overview

The application automatically uses mock data in development mode. Here's what's included:

### 🏢 Organizations (3)
- **TechFlow Solutions** - Primary test org with most data
- **Digital Nomads Inc** - Secondary org with some freelancers
- **Creative Studios** - Minimal org for testing

### 👥 Users (3)
- `admin@techflow.com` - Admin user for TechFlow Solutions
- `manager@digitalnomads.co` - Manager for Digital Nomads Inc
- `admin@creativestudios.com` - Admin for Creative Studios

### 🎯 Freelancers (12)
- Various statuses: active, pending, inactive, error
- Different skill sets and experience levels
- Realistic platform associations

### 🔗 Platforms (4)
- **Amove** - Mock API with 90% success rate
- **Upwork** - OAuth-based with 85% success rate  
- **Fiverr** - Disabled for testing error states
- **Freelancer.com** - Token-based with 88% success rate

### 📊 Platform Configurations
- Pre-configured API keys and settings
- Different enabled states per organization
- Realistic failure scenarios for testing

## Development Features

### 🛠️ Development Panel
- **Access**: Look for the gear icon in the bottom-right corner
- **Features**:
  - Toggle between mock and real data
  - View environment information
  - Quick reload and storage clearing
  - Mock data summary

### 🎭 Mock Data Features
- **Realistic Delays**: Simulated network latency (500-2000ms)
- **Failure Rates**: Built-in error scenarios for testing
- **Real-time Updates**: Mock subscriptions work like real ones
- **Progress Tracking**: Simulated onboarding progress

### 🔧 Console Utilities
Available in development console:

```javascript
// Toggle data source
devUtils.toggleDataSource()

// Check current data source
devUtils.getDataSource()

// Switch to mock/real services
switchToMockServices()
switchToRealServices()
```

## Environment Configuration

### `.env.development`
```bash
NODE_ENV=development
REACT_APP_USE_MOCK=true
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_MOCK_DELAYS=true
```

### Environment Variables
- `REACT_APP_USE_MOCK` - Force mock data usage
- `REACT_APP_ENABLE_MOCK_DELAYS` - Enable/disable simulated delays
- `REACT_APP_ENABLE_ANALYTICS` - Toggle analytics features

## Testing Scenarios

### 🧪 Platform Testing
1. **Success Path**: Use Amove or Upwork platforms
2. **Failure Path**: Try onboarding to Fiverr (always fails)
3. **Mixed Results**: Onboard to multiple platforms simultaneously

### 👤 Freelancer Testing
1. **Create New**: Use the onboarding form
2. **Bulk Operations**: Select multiple freelancers
3. **Error Recovery**: Retry failed platform connections
4. **Status Changes**: Toggle between active/inactive states

### 📈 Progress Tracking
1. **Real-time Updates**: Watch progress bars during onboarding
2. **Error Reporting**: View detailed error messages
3. **Platform Status**: Monitor connection health

## Mock Data Structure

### Freelancer Statuses
- `pending` - Newly created, not yet onboarded
- `active` - Successfully onboarded to at least one platform
- `inactive` - Deactivated by admin
- `error` - Onboarding failed on all platforms

### Platform Statuses
- `pending` - Queued for provisioning
- `provisioning` - Currently being created
- `active` - Successfully created and active
- `failed` - Creation failed with error message
- `deactivated` - Manually deactivated

## Switching to Real Data

When ready to use real services:

1. **Set Environment Variables**
   ```bash
   REACT_APP_USE_MOCK=false
   REACT_APP_SUPABASE_URL=your-project-url
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Update Configuration**
   - Configure real Supabase project
   - Set up platform API credentials
   - Create database schema

3. **Toggle via Dev Panel**
   - Use the development panel to switch at runtime
   - Reload the page to apply changes

## Common Development Tasks

### Adding New Mock Data
1. Edit `src/mock/data.ts`
2. Add new records to appropriate arrays
3. Update relationships (freelancer_platforms, etc.)

### Creating New Mock Platforms
1. Add platform definition to `src/mock/platforms.ts`
2. Implement required interface methods
3. Add to platforms registry

### Testing Error Scenarios
1. Adjust failure rates in mock platform modules
2. Create specific error conditions
3. Test error recovery flows

## Performance Tips

- **Disable Mock Delays**: Set `REACT_APP_ENABLE_MOCK_DELAYS=false` for faster testing
- **Reduce Data Set**: Comment out unused mock data for faster loading
- **Use Dev Panel**: Quick access to reload and clear storage

## Troubleshooting

### Common Issues
1. **Circular Import Errors**: Check service factory imports
2. **Mock Data Not Loading**: Verify environment variables
3. **Real-time Updates Not Working**: Check subscription setup

### Debug Information
- Open browser console for debug logs
- Use React DevTools for context inspection
- Check Network tab for simulated API calls

---

🎉 **Happy Coding!** The mock environment is designed to provide a realistic development experience without external dependencies.