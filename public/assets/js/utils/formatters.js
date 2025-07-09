/**
 * Formatter Utilities
 * Data formatting and display functions
 */

class Formatters {
  /**
   * Format currency
   */
  static currency(amount, options = {}) {
    const {
      currency = 'USD',
      locale = 'en-US',
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      style = 'currency'
    } = options;

    return new Intl.NumberFormat(locale, {
      style,
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(amount);
  }

  /**
   * Format number
   */
  static number(value, options = {}) {
    const {
      locale = 'en-US',
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      style = 'decimal'
    } = options;

    return new Intl.NumberFormat(locale, {
      style,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(value);
  }

  /**
   * Format percentage
   */
  static percentage(value, options = {}) {
    const {
      locale = 'en-US',
      minimumFractionDigits = 0,
      maximumFractionDigits = 2
    } = options;

    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits
    }).format(value / 100);
  }

  /**
   * Format date
   */
  static date(value, options = {}) {
    const {
      locale = 'en-US',
      format = 'medium',
      timeZone = 'UTC'
    } = options;

    const dateObj = new Date(value);
    
    const formatOptions = {
      short: { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      },
      medium: { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      },
      long: { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      },
      time: { 
        hour: '2-digit', 
        minute: '2-digit' 
      },
      datetime: { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      },
      full: { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      }
    };

    return dateObj.toLocaleDateString(locale, {
      ...formatOptions[format],
      timeZone
    });
  }

  /**
   * Format relative time
   */
  static relativeTime(value, options = {}) {
    const {
      locale = 'en-US',
      numeric = 'auto',
      style = 'long'
    } = options;

    const dateObj = new Date(value);
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric, style });

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (Math.abs(interval) >= 1) {
        return rtf.format(interval, unit);
      }
    }

    return rtf.format(0, 'second');
  }

  /**
   * Format file size
   */
  static fileSize(bytes, options = {}) {
    const {
      locale = 'en-US',
      base = 1024,
      precision = 2
    } = options;

    if (bytes === 0) return '0 Bytes';

    const k = base;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(precision))} ${sizes[i]}`;
  }

  /**
   * Format duration
   */
  static duration(seconds, options = {}) {
    const {
      format = 'long',
      showSeconds = true
    } = options;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (format === 'short') {
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${showSeconds ? `${secs}s` : ''}`.trim();
      } else {
        return `${secs}s`;
      }
    } else {
      const parts = [];
      if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      if (showSeconds && secs > 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
      
      return parts.join(', ') || '0 seconds';
    }
  }

  /**
   * Format phone number
   */
  static phoneNumber(value, options = {}) {
    const {
      locale = 'en-US',
      format = 'national'
    } = options;

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return value;

    try {
      const phoneNumber = new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumIntegerDigits: digits.length,
        maximumFractionDigits: 0
      }).format(digits);

      if (format === 'national') {
        // Basic national formatting
        if (digits.length === 10) {
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else if (digits.length === 11 && digits[0] === '1') {
          return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
      }

      return phoneNumber;
    } catch {
      return value;
    }
  }

  /**
   * Format credit card number
   */
  static creditCard(value, options = {}) {
    const {
      mask = true,
      separator = ' '
    } = options;

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return value;

    if (mask && digits.length > 4) {
      const lastFour = digits.slice(-4);
      const masked = '*'.repeat(digits.length - 4);
      return `${masked}${separator}${lastFour}`;
    }

    // Add separators every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, `$1${separator}`);
  }

  /**
   * Format social security number
   */
  static ssn(value, options = {}) {
    const {
      mask = true
    } = options;

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return value;

    if (mask && digits.length === 9) {
      return `***-**-${digits.slice(-4)}`;
    }

    // Format as XXX-XX-XXXX
    if (digits.length === 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    }

    return value;
  }

  /**
   * Format postal code
   */
  static postalCode(value, country = 'US') {
    const digits = value.replace(/\D/g, '');
    
    if (country === 'US' && digits.length === 9) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    } else if (country === 'US' && digits.length === 5) {
      return digits;
    } else if (country === 'CA' && digits.length === 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    }

    return value;
  }

  /**
   * Format name
   */
  static name(value, options = {}) {
    const {
      case: caseType = 'title',
      maxLength
    } = options;

    let formatted = value;

    switch (caseType) {
      case 'title':
        formatted = value.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
        break;
      case 'upper':
        formatted = value.toUpperCase();
        break;
      case 'lower':
        formatted = value.toLowerCase();
        break;
      case 'camel':
        formatted = value.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        ).replace(/\s+/g, '');
        break;
    }

    if (maxLength && formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength) + '...';
    }

    return formatted;
  }

  /**
   * Format address
   */
  static address(address, options = {}) {
    const {
      format = 'full',
      separator = '\n'
    } = options;

    const parts = [];

    if (address.street) parts.push(address.street);
    if (address.street2) parts.push(address.street2);
    
    const cityStateZip = [];
    if (address.city) cityStateZip.push(address.city);
    if (address.state) cityStateZip.push(address.state);
    if (address.zipCode) cityStateZip.push(address.zipCode);
    
    if (cityStateZip.length > 0) {
      parts.push(cityStateZip.join(', '));
    }
    
    if (address.country) parts.push(address.country);

    if (format === 'inline') {
      return parts.join(', ');
    }

    return parts.join(separator);
  }

  /**
   * Format list
   */
  static list(items, options = {}) {
    const {
      separator = ', ',
      conjunction = 'and',
      maxItems,
      ellipsis = '...'
    } = options;

    if (!Array.isArray(items)) return '';

    let formattedItems = items;

    if (maxItems && items.length > maxItems) {
      formattedItems = items.slice(0, maxItems);
    }

    if (formattedItems.length === 0) return '';
    if (formattedItems.length === 1) return formattedItems[0];

    const lastItem = formattedItems.pop();
    const result = formattedItems.join(separator) + ` ${conjunction} ${lastItem}`;

    if (maxItems && items.length > maxItems) {
      return result + ellipsis;
    }

    return result;
  }

  /**
   * Format table
   */
  static table(data, options = {}) {
    const {
      headers = [],
      align = 'left',
      separator = ' | ',
      showHeaders = true
    } = options;

    if (!Array.isArray(data) || data.length === 0) return '';

    const tableHeaders = headers.length > 0 ? headers : Object.keys(data[0]);
    const rows = [];

    if (showHeaders) {
      rows.push(tableHeaders.join(separator));
      rows.push(tableHeaders.map(() => '---').join(separator));
    }

    data.forEach(row => {
      const formattedRow = tableHeaders.map(header => {
        const value = row[header] || '';
        return String(value);
      });
      rows.push(formattedRow.join(separator));
    });

    return rows.join('\n');
  }

  /**
   * Format progress bar
   */
  static progressBar(value, max = 100, options = {}) {
    const {
      width = 20,
      filledChar = '█',
      emptyChar = '░',
      showPercentage = true
    } = options;

    const percentage = Math.min(Math.max(value / max, 0), 1);
    const filledWidth = Math.round(width * percentage);
    const emptyWidth = width - filledWidth;

    const bar = filledChar.repeat(filledWidth) + emptyChar.repeat(emptyWidth);
    
    if (showPercentage) {
      return `${bar} ${Math.round(percentage * 100)}%`;
    }

    return bar;
  }

  /**
   * Format slug
   */
  static slug(value, options = {}) {
    const {
      separator = '-',
      lowercase = true,
      removeSpecialChars = true
    } = options;

    let slug = value;

    if (lowercase) {
      slug = slug.toLowerCase();
    }

    if (removeSpecialChars) {
      slug = slug.replace(/[^\w\s-]/g, '');
    }

    slug = slug.replace(/[\s_-]+/g, separator);
    slug = slug.replace(new RegExp(`^${separator}|${separator}$`, 'g'), '');

    return slug;
  }

  /**
   * Format initials
   */
  static initials(name, options = {}) {
    const {
      maxLength = 2,
      separator = ''
    } = options;

    if (!name) return '';

    const words = name.trim().split(/\s+/);
    const initials = words
      .slice(0, maxLength)
      .map(word => word.charAt(0).toUpperCase())
      .join(separator);

    return initials;
  }

  /**
   * Format truncate
   */
  static truncate(value, options = {}) {
    const {
      length = 100,
      suffix = '...',
      preserveWords = true
    } = options;

    if (!value || value.length <= length) return value;

    if (preserveWords) {
      const truncated = value.substring(0, length);
      const lastSpace = truncated.lastIndexOf(' ');
      
      if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + suffix;
      }
    }

    return value.substring(0, length) + suffix;
  }

  /**
   * Format mask
   */
  static mask(value, pattern, options = {}) {
    const {
      placeholder = '_',
      showMask = false
    } = options;

    if (!value || !pattern) return value;

    const digits = value.replace(/\D/g, '');
    let result = '';
    let digitIndex = 0;

    for (let i = 0; i < pattern.length && digitIndex < digits.length; i++) {
      const char = pattern[i];
      
      if (char === '#') {
        result += digits[digitIndex];
        digitIndex++;
      } else if (char === '*') {
        result += digits[digitIndex] || placeholder;
        digitIndex++;
      } else {
        result += char;
      }
    }

    if (showMask) {
      // Fill remaining pattern with placeholders
      for (let i = result.length; i < pattern.length; i++) {
        const char = pattern[i];
        if (char === '#' || char === '*') {
          result += placeholder;
        } else {
          result += char;
        }
      }
    }

    return result;
  }

  /**
   * Format ordinal
   */
  static ordinal(value, options = {}) {
    const {
      locale = 'en-US'
    } = options;

    const num = parseInt(value);
    if (isNaN(num)) return value;

    const suffixes = {
      'en-US': ['th', 'st', 'nd', 'rd'],
      'es': ['º', 'º', 'º', 'º'],
      'fr': ['e', 'er', 'e', 'e']
    };

    const suffixList = suffixes[locale] || suffixes['en-US'];
    const suffix = num % 100 >= 11 && num % 100 <= 13 
      ? suffixList[0] 
      : suffixList[num % 10] || suffixList[0];

    return `${num}${suffix}`;
  }

  /**
   * Format plural
   */
  static plural(value, singular, plural, options = {}) {
    const {
      locale = 'en-US',
      includeNumber = true
    } = options;

    const num = parseInt(value);
    if (isNaN(num)) return value;

    const form = num === 1 ? singular : plural;
    
    if (includeNumber) {
      return `${num} ${form}`;
    }
    
    return form;
  }

  /**
   * Format compact number
   */
  static compactNumber(value, options = {}) {
    const {
      locale = 'en-US',
      notation = 'compact',
      compactDisplay = 'short'
    } = options;

    return new Intl.NumberFormat(locale, {
      notation,
      compactDisplay
    }).format(value);
  }

  /**
   * Format scientific notation
   */
  static scientific(value, options = {}) {
    const {
      locale = 'en-US',
      notation = 'scientific',
      maximumSignificantDigits = 3
    } = options;

    return new Intl.NumberFormat(locale, {
      notation,
      maximumSignificantDigits
    }).format(value);
  }

  /**
   * Format engineering notation
   */
  static engineering(value, options = {}) {
    const {
      locale = 'en-US',
      notation = 'engineering',
      maximumSignificantDigits = 3
    } = options;

    return new Intl.NumberFormat(locale, {
      notation,
      maximumSignificantDigits
    }).format(value);
  }
}

// Export for use in other modules
window.Formatters = Formatters;