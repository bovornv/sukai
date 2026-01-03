import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../features/auth/providers/auth_provider.dart';

enum SubscriptionPlan {
  free,
  pro,
  premiumDoctor,
}

class BillingService {
  final Dio _dio;
  final String baseUrl;
  final SharedPreferences _prefs;
  final Ref? _ref;

  BillingService({
    Dio? dio,
    String? baseUrl,
    required SharedPreferences prefs,
    Ref? ref,
  })  : _dio = dio ?? Dio(),
        baseUrl = baseUrl ?? ApiConfig.privateBaseUrl,
        _prefs = prefs,
        _ref = ref;

  /// Get current subscription plan
  Future<SubscriptionPlan> getCurrentPlan() async {
    final planString = _prefs.getString('subscription_plan') ?? 'free';
    return SubscriptionPlan.values.firstWhere(
      (p) => p.toString().split('.').last == planString,
      orElse: () => SubscriptionPlan.free,
    );
  }

  /// Set subscription plan
  Future<void> setPlan(SubscriptionPlan plan) async {
    await _prefs.setString('subscription_plan', plan.toString().split('.').last);
  }

  /// Check if user has unlimited checks
  /// NOTE: Free Plan currently has unlimited checks (no restrictions)
  /// This method is kept for future Pro/Premium plan differentiation
  Future<bool> hasUnlimitedChecks() async {
    final plan = await getCurrentPlan();
    // Free Plan is currently unlimited (no restrictions)
    // Pro and Premium Doctor are also unlimited (when they become available)
    return true; // All plans are unlimited for now
  }

  /// Check daily usage limit
  /// NOTE: Free Plan currently has NO daily limits (unlimited assessments)
  /// This method always returns true to ensure no disruption to clinical flow
  /// Medical accuracy is NOT restricted by plan
  Future<bool> canCheckToday() async {
    // Free Plan: Unlimited assessments (no restrictions)
    // This ensures Free Plan feels complete and valuable
    return true;
  }

  /// Increment daily check count
  Future<void> incrementCheckCount() async {
    final count = (_prefs.getInt('daily_check_count') ?? 0) + 1;
    await _prefs.setInt('daily_check_count', count);
  }

  /// Subscribe to a plan
  Future<bool> subscribe(SubscriptionPlan plan) async {
    try {
      final headers = <String, String>{};
      final userId = _ref?.read(authProvider).userId;
      if (userId != null) {
        headers['x-user-id'] = userId;
      }
      
      final response = await _dio.post(
        '$baseUrl/billing/subscribe',
        data: {'plan': plan.toString().split('.').last},
        options: Options(headers: headers),
      );

      if (response.statusCode == 200) {
        await setPlan(plan);
        return true;
      }
      return false;
    } catch (e) {
      // For development, just set locally
      await setPlan(plan);
      return true;
    }
  }
}
