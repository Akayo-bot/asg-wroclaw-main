// Validation utility functions for auth forms

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validators = {
  email: (value: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!value) {
      return { isValid: false, error: 'Email is required' };
    }
    
    if (!emailRegex.test(value)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    
    if (value.length > 255) {
      return { isValid: false, error: 'Email must be less than 255 characters' };
    }
    
    return { isValid: true };
  },
  
  password: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Password is required' };
    }
    
    if (value.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters' };
    }
    
    if (!/[A-Z]/.test(value)) {
      return { isValid: false, error: 'Include at least one uppercase letter' };
    }
    
    if (!/[0-9]/.test(value)) {
      return { isValid: false, error: 'Include at least one number' };
    }
    
    return { isValid: true };
  },
  
  confirmPassword: (password: string, confirm: string): ValidationResult => {
    if (!confirm) {
      return { isValid: false, error: 'Please confirm your password' };
    }
    
    if (password !== confirm) {
      return { isValid: false, error: 'Passwords do not match' };
    }
    
    return { isValid: true };
  },
  
  name: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'Name is required' };
    }
    
    if (value.trim().length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters' };
    }
    
    if (value.length > 100) {
      return { isValid: false, error: 'Name must be less than 100 characters' };
    }
    
    return { isValid: true };
  },
  
  terms: (accepted: boolean): ValidationResult => {
    if (!accepted) {
      return { isValid: false, error: 'You must accept the terms and conditions' };
    }
    
    return { isValid: true };
  }
};
