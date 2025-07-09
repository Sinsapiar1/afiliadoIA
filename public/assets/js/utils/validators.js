/**
 * Validation Utilities
 * Form validation and data validation functions
 */

class Validators {
  /**
   * Required field validation
   */
  static required(value, message = 'This field is required') {
    if (value === null || value === undefined) return message;
    if (typeof value === 'string' && value.trim() === '') return message;
    if (Array.isArray(value) && value.length === 0) return message;
    return null;
  }

  /**
   * Email validation
   */
  static email(value, message = 'Please enter a valid email address') {
    if (!value) return null; // Skip if empty (use required for mandatory)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
  }

  /**
   * URL validation
   */
  static url(value, message = 'Please enter a valid URL') {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return message;
    }
  }

  /**
   * Phone number validation
   */
  static phone(value, message = 'Please enter a valid phone number') {
    if (!value) return null;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone) ? null : message;
  }

  /**
   * Minimum length validation
   */
  static minLength(value, min, message = `Minimum length is ${min} characters`) {
    if (!value) return null;
    if (typeof value === 'string' && value.length < min) return message;
    if (Array.isArray(value) && value.length < min) return message;
    return null;
  }

  /**
   * Maximum length validation
   */
  static maxLength(value, max, message = `Maximum length is ${max} characters`) {
    if (!value) return null;
    if (typeof value === 'string' && value.length > max) return message;
    if (Array.isArray(value) && value.length > max) return message;
    return null;
  }

  /**
   * Length range validation
   */
  static length(value, min, max, message = `Length must be between ${min} and ${max} characters`) {
    if (!value) return null;
    const length = typeof value === 'string' ? value.length : value.length;
    if (length < min || length > max) return message;
    return null;
  }

  /**
   * Minimum value validation
   */
  static min(value, min, message = `Minimum value is ${min}`) {
    if (!value) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < min) return message;
    return null;
  }

  /**
   * Maximum value validation
   */
  static max(value, max, message = `Maximum value is ${max}`) {
    if (!value) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue > max) return message;
    return null;
  }

  /**
   * Value range validation
   */
  static range(value, min, max, message = `Value must be between ${min} and ${max}`) {
    if (!value) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < min || numValue > max) return message;
    return null;
  }

  /**
   * Number validation
   */
  static number(value, message = 'Please enter a valid number') {
    if (!value) return null;
    return !isNaN(parseFloat(value)) && isFinite(value) ? null : message;
  }

  /**
   * Integer validation
   */
  static integer(value, message = 'Please enter a valid integer') {
    if (!value) return null;
    return Number.isInteger(parseFloat(value)) ? null : message;
  }

  /**
   * Positive number validation
   */
  static positive(value, message = 'Please enter a positive number') {
    if (!value) return null;
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue > 0 ? null : message;
  }

  /**
   * Negative number validation
   */
  static negative(value, message = 'Please enter a negative number') {
    if (!value) return null;
    const numValue = parseFloat(value);
    return !isNaN(numValue) && numValue < 0 ? null : message;
  }

  /**
   * Decimal places validation
   */
  static decimals(value, places, message = `Maximum ${places} decimal places allowed`) {
    if (!value) return null;
    const strValue = value.toString();
    const decimalIndex = strValue.indexOf('.');
    if (decimalIndex === -1) return null;
    const decimalPlaces = strValue.length - decimalIndex - 1;
    return decimalPlaces <= places ? null : message;
  }

  /**
   * Pattern validation (regex)
   */
  static pattern(value, regex, message = 'Invalid format') {
    if (!value) return null;
    return regex.test(value) ? null : message;
  }

  /**
   * Alphanumeric validation
   */
  static alphanumeric(value, message = 'Only letters and numbers are allowed') {
    if (!value) return null;
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(value) ? null : message;
  }

  /**
   * Alphabetic validation
   */
  static alphabetic(value, message = 'Only letters are allowed') {
    if (!value) return null;
    const alphabeticRegex = /^[a-zA-Z\s]+$/;
    return alphabeticRegex.test(value) ? null : message;
  }

  /**
   * Numeric validation
   */
  static numeric(value, message = 'Only numbers are allowed') {
    if (!value) return null;
    const numericRegex = /^[0-9]+$/;
    return numericRegex.test(value) ? null : message;
  }

  /**
   * Date validation
   */
  static date(value, message = 'Please enter a valid date') {
    if (!value) return null;
    const date = new Date(value);
    return !isNaN(date.getTime()) ? null : message;
  }

  /**
   * Future date validation
   */
  static futureDate(value, message = 'Date must be in the future') {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    return date > now ? null : message;
  }

  /**
   * Past date validation
   */
  static pastDate(value, message = 'Date must be in the past') {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    return date < now ? null : message;
  }

  /**
   * Date range validation
   */
  static dateRange(value, minDate, maxDate, message = 'Date must be within the specified range') {
    if (!value) return null;
    const date = new Date(value);
    const min = new Date(minDate);
    const max = new Date(maxDate);
    return date >= min && date <= max ? null : message;
  }

  /**
   * Age validation
   */
  static age(value, minAge, maxAge, message = `Age must be between ${minAge} and ${maxAge}`) {
    if (!value) return null;
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= minAge && age <= maxAge ? null : message;
  }

  /**
   * Credit card validation (Luhn algorithm)
   */
  static creditCard(value, message = 'Please enter a valid credit card number') {
    if (!value) return null;
    
    // Remove spaces and dashes
    const cleanValue = value.replace(/\s+/g, '').replace(/-/g, '');
    
    // Check if it's a number and has valid length
    if (!/^\d{13,19}$/.test(cleanValue)) return message;
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanValue.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanValue.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0 ? null : message;
  }

  /**
   * Password strength validation
   */
  static passwordStrength(value, options = {}) {
    if (!value) return null;
    
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true
    } = options;
    
    const errors = [];
    
    if (value.length < minLength) {
      errors.push(`At least ${minLength} characters`);
    }
    
    if (requireUppercase && !/[A-Z]/.test(value)) {
      errors.push('At least one uppercase letter');
    }
    
    if (requireLowercase && !/[a-z]/.test(value)) {
      errors.push('At least one lowercase letter');
    }
    
    if (requireNumbers && !/\d/.test(value)) {
      errors.push('At least one number');
    }
    
    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.push('At least one special character');
    }
    
    return errors.length === 0 ? null : errors.join(', ');
  }

  /**
   * Password confirmation validation
   */
  static passwordConfirmation(value, password, message = 'Passwords do not match') {
    if (!value) return null;
    return value === password ? null : message;
  }

  /**
   * File size validation
   */
  static fileSize(file, maxSize, message = `File size must be less than ${maxSize} bytes`) {
    if (!file) return null;
    return file.size <= maxSize ? null : message;
  }

  /**
   * File type validation
   */
  static fileType(file, allowedTypes, message = 'File type not allowed') {
    if (!file) return null;
    return allowedTypes.includes(file.type) ? null : message;
  }

  /**
   * File extension validation
   */
  static fileExtension(file, allowedExtensions, message = 'File extension not allowed') {
    if (!file) return null;
    const extension = file.name.split('.').pop().toLowerCase();
    return allowedExtensions.includes(extension) ? null : message;
  }

  /**
   * Array validation
   */
  static array(value, message = 'Value must be an array') {
    if (!value) return null;
    return Array.isArray(value) ? null : message;
  }

  /**
   * Object validation
   */
  static object(value, message = 'Value must be an object') {
    if (!value) return null;
    return typeof value === 'object' && !Array.isArray(value) ? null : message;
  }

  /**
   * Boolean validation
   */
  static boolean(value, message = 'Value must be a boolean') {
    if (value === null || value === undefined) return null;
    return typeof value === 'boolean' ? null : message;
  }

  /**
   * Custom validation function
   */
  static custom(value, validator, message = 'Invalid value') {
    if (!value) return null;
    return validator(value) ? null : message;
  }

  /**
   * Validate form data
   */
  static validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = formData[field];
      const fieldErrors = [];
      
      for (const rule of fieldRules) {
        let validator, params, message;
        
        if (typeof rule === 'string') {
          validator = this[rule];
          params = [value];
        } else if (typeof rule === 'function') {
          validator = rule;
          params = [value];
        } else {
          validator = this[rule.validator];
          params = [value, ...rule.params];
          message = rule.message;
        }
        
        if (validator) {
          const error = validator(...params, message);
          if (error) {
            fieldErrors.push(error);
          }
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate single field
   */
  static validateField(value, rules) {
    const errors = [];
    
    for (const rule of rules) {
      let validator, params, message;
      
      if (typeof rule === 'string') {
        validator = this[rule];
        params = [value];
      } else if (typeof rule === 'function') {
        validator = rule;
        params = [value];
      } else {
        validator = this[rule.validator];
        params = [value, ...rule.params];
        message = rule.message;
      }
      
      if (validator) {
        const error = validator(...params, message);
        if (error) {
          errors.push(error);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create validation schema
   */
  static createSchema(schema) {
    return {
      validate: (data) => this.validateForm(data, schema),
      validateField: (field, value) => {
        if (schema[field]) {
          return this.validateField(value, schema[field]);
        }
        return { isValid: true, errors: [] };
      }
    };
  }

  /**
   * Common validation schemas
   */
  static schemas = {
    user: {
      email: ['required', 'email'],
      password: ['required', { validator: 'minLength', params: [8] }],
      confirmPassword: ['required', 'passwordConfirmation'],
      firstName: ['required', 'alphabetic'],
      lastName: ['required', 'alphabetic'],
      phone: ['phone'],
      age: [{ validator: 'age', params: [18, 100] }]
    },
    
    product: {
      name: ['required', { validator: 'minLength', params: [3] }],
      price: ['required', 'number', 'positive'],
      description: ['required', { validator: 'minLength', params: [10] }],
      category: ['required'],
      stock: ['required', 'integer', 'positive']
    },
    
    address: {
      street: ['required'],
      city: ['required'],
      state: ['required'],
      zipCode: ['required', 'pattern', /^\d{5}(-\d{4})?$/],
      country: ['required']
    },
    
    payment: {
      cardNumber: ['required', 'creditCard'],
      expiryDate: ['required', 'date', 'futureDate'],
      cvv: ['required', 'numeric', { validator: 'length', params: [3, 4] }],
      cardholderName: ['required', 'alphabetic']
    }
  };
}

// Export for use in other modules
window.Validators = Validators;