/// API Configuration
/// Separated into PUBLIC and PRIVATE APIs for security and PDPA compliance
class ApiConfig {
  // Development
  static const String devPrivateBaseUrl = 'http://localhost:3000/api/private';
  static const String devPublicBaseUrl = 'http://localhost:3000/api/public';
  
  // Production
  static const String prodPrivateBaseUrl = 'https://sukai-production.up.railway.app/api/private';
  static const String prodPublicBaseUrl = 'https://sukai-production.up.railway.app/api/public';
  
  // Current environment
  static const bool isProduction = true;
  
  /// Get PRIVATE API base URL (requires authentication)
  /// Use for: triage, diagnosis, notifications, follow-ups, billing, device tokens
  static String get privateBaseUrl {
    return isProduction ? prodPrivateBaseUrl : devPrivateBaseUrl;
  }
  
  /// Get PUBLIC API base URL (no authentication)
  /// Use for: symptom taxonomy, health education, public health data
  static String get publicBaseUrl {
    return isProduction ? prodPublicBaseUrl : devPublicBaseUrl;
  }
  
  /// Legacy base URL (for backward compatibility during migration)
  /// TODO: Remove after all routes are migrated to /api/private/*
  @Deprecated('Use privateBaseUrl instead')
  static String get baseUrl {
    return isProduction 
        ? 'https://sukai-production.up.railway.app/api'
        : 'http://localhost:3000/api';
  }
  
  /// Get the full backend URL (without /api)
  static String get backendUrl {
    final url = privateBaseUrl.replaceAll('/api/private', '');
    return url;
  }
}

