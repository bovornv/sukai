/// API Configuration
/// Update baseUrl for production deployment
class ApiConfig {
  // Development
  static const String devBaseUrl = 'http://localhost:3000/api';
  
  // Production - Update this after deploying backend
  static const String prodBaseUrl = 'https://sukai-production.up.railway.app/api';
  
  // Current environment
  static const bool isProduction = true; // Set to true in production
  
  /// Get the current base URL based on environment
  static String get baseUrl {
    return isProduction ? prodBaseUrl : devBaseUrl;
  }
  
  /// Get the full backend URL (without /api)
  static String get backendUrl {
    final url = baseUrl.replaceAll('/api', '');
    return url;
  }
}

