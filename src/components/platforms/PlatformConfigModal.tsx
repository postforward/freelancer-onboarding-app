import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, TestTube, Save } from 'lucide-react';
import { usePlatforms } from '../../contexts/PlatformContext';
import { useToast } from '../../contexts/ToastContext';
import type { IPlatformModule } from '../../types/platform.types';
import { z } from 'zod';

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
    const existingConfig = getPlatformConfig(platformId);
    if (existingConfig?.config) {
      setConfig(existingConfig.config);
    }
  }, [platformId, getPlatformConfig]);

  if (!isOpen) return null;

  const schema = platform.metadata.configSchema as z.ZodObject<any>;
  const schemaShape = schema.shape;

  const handleInputChange = (field: string, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateConfig = (): boolean => {
    try {
      schema.parse(config);
      setErrors({});
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
      }
      return false;
    }
  };

  const handleTest = async () => {
    if (!validateConfig()) {
      showToast('Please fix configuration errors before testing', 'error');
      return;
    }

    setTesting(true);
    try {
      // Save configuration first
      await configurePlatform(platformId, config);
      
      // Then test connection
      const result = await testPlatformConnection(platformId);
      
      if (result.success) {
        showToast('Connection test successful!', 'success');
      } else {
        showToast(result.error || 'Connection test failed', 'error');
      }
    } catch (error) {
      showToast('Failed to test connection', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validateConfig()) {
      showToast('Please fix configuration errors', 'error');
      return;
    }

    setSaving(true);
    try {
      await configurePlatform(platformId, config);
      showToast('Configuration saved successfully', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (fieldName: string, fieldSchema: z.ZodTypeAny) => {
    const isOptional = fieldSchema.isOptional();
    const description = (fieldSchema as any)._def?.description;
    const isSecret = fieldName.toLowerCase().includes('key') || 
                    fieldName.toLowerCase().includes('password') ||
                    fieldName.toLowerCase().includes('secret');

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
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
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
              onClick={onClose}
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