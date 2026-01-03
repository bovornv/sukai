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
  
  /// Legacy base URL (DEPRECATED - removed after migration)
  /// All services now use privateBaseUrl or publicBaseUrl
  @Deprecated('Use privateBaseUrl or publicBaseUrl instead. This will be removed in next version.')
  static String get baseUrl {
    // Fallback to privateBaseUrl for backward compatibility
    return privateBaseUrl.replaceAll('/private', '');
  }
  
  /// Get the full backend URL (without /api)
  static String get backendUrl {
    final url = privateBaseUrl.replaceAll('/api/private', '');
    return url;
  }
}

