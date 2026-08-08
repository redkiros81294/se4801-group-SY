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
  handleSubmit: (onSubmit: (values: Record<string, any>) => void | Promise<void>) => (e: React.FormEvent<HTMLFormElement>) => void;
  setFieldValue: (field: string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  validateField: (field: string, rules: ValidationRule[]) => boolean;
  validateForm: (rules: Record<string, ValidationRule[]>) => boolean;
  resetForm: (initialValues?: Record<string, any>) => void;
}

interface ValidationRules {
  [key: string]: ((value: any) => boolean)[];
}

export const useFormValidation = (
  initialValues: Record<string, any> = {},
  validationRules?: ValidationRules
): UseFormValidationReturn => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateAll = useCallback(() => {
    if (!validationRules) return true;
    let isValid = true;
    const newErrors: FormErrors = {};
    Object.keys(validationRules).forEach(field => {
      const value = values[field];
      const rules = validationRules[field];
      for (const rule of rules) {
        if (!rule(value)) {
          newErrors[field] = 'Invalid';
          isValid = false;
          break;
        }
      }
    });
    setErrors(newErrors);
    return isValid;
  }, [validationRules, values]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    if (validationRules && validationRules[name]) {
      const value = values[name];
      for (const rule of validationRules[name]) {
        if (!rule(value)) {
          setErrors(prev => ({ ...prev, [name]: 'Invalid' }));
          return;
        }
      }
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [validationRules, values]);

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

  const handleSubmit = useCallback((onSubmit: (values: Record<string, any>) => void | Promise<void>) => {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const valid = validateAll();
      if (valid) {
        onSubmit(values);
      }
    };
  }, [validateAll, values]);

  // Defaults to the hook's own initial values (not an empty object) so forms
  // like AdminOrganizations keep their orgType default after reset/cancel.
  const resetForm = useCallback((nextValues: Record<string, any> = initialValues) => {
    setValues(nextValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    clearFieldError,
    validateField,
    validateForm,
    resetForm
  };
};
