import { useState, useCallback } from 'react';

interface FormErrors {
  [key: string]: string;
}

interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

interface UseFormValidationReturn {
  values: Record<string, any>;
  errors: FormErrors;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFieldValue: (field: string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  validateField: (field: string, rules: ValidationRule[]) => boolean;
  validateForm: (rules: Record<string, ValidationRule[]>) => boolean;
  resetForm: (initialValues?: Record<string, any>) => void;
}

export const useFormValidation = (initialValues: Record<string, any> = {}): UseFormValidationReturn => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    // Validation will be handled by calling validateField separately
  }, []);

  const setFieldValue = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const validateField = useCallback((field: string, rules: ValidationRule[]): boolean => {
    const value = values[field];
    for (const rule of rules) {
      if (!rule.validate(value)) {
        setFieldError(field, rule.message);
        return false;
      }
    }
    clearFieldError(field);
    return true;
  }, [values, setFieldError, clearFieldError]);

  const validateForm = useCallback((fieldRules: Record<string, ValidationRule[]>): boolean => {
    let isValid = true;
    Object.keys(fieldRules).forEach(field => {
      if (!validateField(field, fieldRules[field])) {
        isValid = false;
      }
    });
    return isValid;
  }, [validateField]);

  const resetForm = useCallback((initialValues: Record<string, any> = {}) => {
    setValues(initialValues);
    setErrors({});
  }, []);

  return {
    values,
    errors,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    clearFieldError,
    validateField,
    validateForm,
    resetForm
  };
};
