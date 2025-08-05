import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, TestTube, Save } from 'lucide-react';
import { usePlatforms } from '../../contexts/PlatformContext';
import { useToast } from '../../contexts/ToastContext';
import type { IPlatformModule } from '../../types/platform.types';
import { z } from 'zod';
import { DebugLogger, debugGroup } from '../../utils/debugLogger';

interface PlatformConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformId: string;
  platform: IPlatformModule;
}

export function PlatformConfigModal({
  isOpen,
  onClose,
  platformId,
  platform
}: PlatformConfigModalProps) {
  const { configurePlatform, testPlatformConnection, getPlatformConfig } = usePlatforms();
  const { showToast } = useToast();
  const [config, setConfig] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing configuration
  useEffect(() => {
    debugGroup(`Load Config for ${platformId}`, () => {
      DebugLogger.log('PlatformConfigModal', 'Loading existing configuration', { platformId });
    });
    
    const existingConfig = getPlatformConfig(platformId);
    if (existingConfig?.config) {
      DebugLogger.log('PlatformConfigModal', 'Found existing config', { 
        platformId, 
        configKeys: Object.keys(existingConfig.config) 
      });
      setConfig(existingConfig.config);
    } else {
      DebugLogger.log('PlatformConfigModal', 'No existing config found', { platformId });
    }
  }, [platformId, getPlatformConfig]);

  if (!isOpen) {
    DebugLogger.log('PlatformConfigModal', 'Modal is closed, not rendering', { platformId });
    return null;
  }
  
  DebugLogger.log('PlatformConfigModal', 'Modal is open, rendering', { 
    platformId, 
    platformName: platform.metadata.name 
  });

  const schema = platform.metadata.configSchema as z.ZodObject<any>;
  
  if (!schema) {
    DebugLogger.error('PlatformConfigModal', 'No configSchema found for platform', { platformId, platform: platform.metadata });
    return null;
  }
  
  const schemaShape = schema.shape;

  const handleInputChange = (field: string, value: any) => {
    DebugLogger.log('PlatformConfigModal', 'Input changed', { 
      platformId, 
      field, 
      value: field.toLowerCase().includes('key') || field.toLowerCase().includes('password') ? '[REDACTED]' : value 
    });
    
    setConfig(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      if (Object.keys(newErrors).length === 0) {
        DebugLogger.success('PlatformConfigModal', 'All validation errors cleared');
      }
      return newErrors;
    });
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateConfig = (): boolean => {
    DebugLogger.log('PlatformConfigModal', 'Validating configuration', { 
      platformId,
      configFields: Object.keys(config) 
    });
    
    try {
      schema.parse(config);
      setErrors({});
      DebugLogger.success('PlatformConfigModal', 'Configuration validation passed', { platformId });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        DebugLogger.validation('PlatformConfigModal', 'configuration', false, newErrors);
      } else {
        DebugLogger.error('PlatformConfigModal', 'Unexpected validation error', error);
      }
      return false;
    }
  };

  const handleTest = async () => {
    debugGroup(`Test Connection: ${platformId}`, () => {
      DebugLogger.log('PlatformConfigModal', 'Starting connection test', { platformId });
    });
    
    if (!validateConfig()) {
      DebugLogger.warn('PlatformConfigModal', 'Connection test blocked by validation errors');
      showToast({ type: 'error', title: 'Please fix configuration errors before testing' });
      return;
    }

    setTesting(true);
    DebugLogger.log('PlatformConfigModal', 'Setting testing state to true');
    
    try {
      // Test connection directly with form data (no need to save first)
      DebugLogger.log('PlatformConfigModal', 'Testing platform connection with form data', { 
        platformId,
        configFields: Object.keys(config)
      });
      const result = await testPlatformConnection(platformId, config);
      
      if (result.success) {
        DebugLogger.success('PlatformConfigModal', 'Connection test successful', { platformId, result });
        showToast({ type: 'success', title: 'Connection test successful!' });
      } else {
        DebugLogger.error('PlatformConfigModal', 'Connection test failed', { platformId, error: result.error });
        showToast({ type: 'error', title: result.error || 'Connection test failed' });
      }
    } catch (error) {
      DebugLogger.error('PlatformConfigModal', 'Exception during connection test', { platformId, error });
      showToast({ type: 'error', title: 'Failed to test connection' });
    } finally {
      DebugLogger.log('PlatformConfigModal', 'Setting testing state to false');
      setTesting(false);
    }
  };

  const handleSave = async () => {
    debugGroup(`Save Configuration: ${platformId}`, () => {
      DebugLogger.log('PlatformConfigModal', 'Starting configuration save', { platformId });
    });
    
    if (!validateConfig()) {
      DebugLogger.warn('PlatformConfigModal', 'Save blocked by validation errors');
      showToast({ type: 'error', title: 'Please fix configuration errors' });
      return;
    }

    setSaving(true);
    DebugLogger.log('PlatformConfigModal', 'Setting saving state to true');
    
    try {
      DebugLogger.log('PlatformConfigModal', 'Calling configurePlatform', { 
        platformId, 
        configFields: Object.keys(config) 
      });
      await configurePlatform(platformId, config);
      DebugLogger.success('PlatformConfigModal', 'Configuration saved successfully', { platformId });
      showToast({ type: 'success', title: 'Configuration saved and platform enabled!' });
      
      DebugLogger.log('PlatformConfigModal', 'Closing modal after successful save');
      onClose();
    } catch (error) {
      DebugLogger.error('PlatformConfigModal', 'Failed to save configuration', { platformId, error });
      showToast({ type: 'error', title: 'Failed to save configuration' });
    } finally {
      DebugLogger.log('PlatformConfigModal', 'Setting saving state to false');
      setSaving(false);
    }
  };

  const renderField = (fieldName: string, fieldSchema: z.ZodTypeAny) => {
    const isOptional = fieldSchema.isOptional();
    const description = (fieldSchema as any)._def?.description;
    const isSecret = fieldName.toLowerCase().includes('key') || 
                    fieldName.toLowerCase().includes('password') ||
                    fieldName.toLowerCase().includes('secret');
    
    DebugLogger.log('PlatformConfigModal', 'Rendering form field', { 
      platformId, 
      fieldName, 
      isOptional, 
      isSecret,
      hasDescription: !!description,
      currentValue: isSecret ? '[REDACTED]' : config[fieldName]
    });

    // Get the base type
    let baseType = fieldSchema;
    if (baseType instanceof z.ZodOptional) {
      baseType = baseType._def.innerType;
    }

    // Determine input type
    let inputType = 'text';
    if (baseType instanceof z.ZodNumber) {
      inputType = 'number';
    } else if (baseType instanceof z.ZodBoolean) {
      inputType = 'checkbox';
    } else if (isSecret) {
      inputType = showSecrets[fieldName] ? 'text' : 'password';
    }

    return (
      <div key={fieldName} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          {!isOptional && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}

        <div className="relative">
          {inputType === 'checkbox' ? (
            <input
              type="checkbox"
              checked={config[fieldName] || false}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          ) : (
            <>
              <input
                type={inputType}
                value={config[fieldName] || ''}
                onChange={(e) => handleInputChange(
                  fieldName, 
                  inputType === 'number' ? Number(e.target.value) : e.target.value
                )}
                className={`
                  block w-full px-3 py-2 border rounded-md shadow-sm 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
                  ${errors[fieldName] ? 'border-red-500' : 'border-gray-300'}
                  ${isSecret ? 'pr-10' : ''}
                `}
                placeholder={isOptional ? 'Optional' : 'Required'}
              />
              
              {isSecret && (
                <button
                  type="button"
                  onClick={() => toggleSecretVisibility(fieldName)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showSecrets[fieldName] ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {errors[fieldName] && (
          <p className="text-sm text-red-600">{errors[fieldName]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configure {platform.metadata.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {platform.metadata.description}
            </p>
          </div>
          <button
            onClick={() => {
              DebugLogger.log('PlatformConfigModal', 'Modal close button clicked', { platformId });
              onClose();
            }}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-800">
              <strong>Configure your {platform.metadata.displayName} integration:</strong> Fill in the required fields below and click "Save Configuration". The platform will be automatically enabled after saving.
            </p>
          </div>

          {platform.metadata.documentationUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                Need help? Check the{' '}
                <a
                  href={platform.metadata.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  API documentation
                </a>
              </p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(schemaShape).map(([fieldName, fieldSchema]) => 
              renderField(fieldName, fieldSchema as z.ZodTypeAny)
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={handleTest}
            disabled={testing || saving}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Testing...' : 'Test Connection'}
          </button>

          <div className="space-x-3">
            <button
              onClick={() => {
                DebugLogger.log('PlatformConfigModal', 'Cancel button clicked', { platformId });
                onClose();
              }}
              disabled={saving || testing}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || testing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}