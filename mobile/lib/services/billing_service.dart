import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';

enum SubscriptionPlan {
  free,
  pro,
  premiumDoctor,
}

class BillingService {
  final Dio _dio;
  final String baseUrl;
  final SharedPreferences _prefs;

  BillingService({
    Dio? dio,
    String? baseUrl,
    required SharedPreferences prefs,
  })  : _dio = dio ?? Dio(),
        baseUrl = baseUrl ?? ApiConfig.baseUrl,
        _prefs = prefs;

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
  Future<bool> hasUnlimitedChecks() async {
    final plan = await getCurrentPlan();
    return plan == SubscriptionPlan.pro || plan == SubscriptionPlan.premiumDoctor;
  }

  /// Check daily usage limit (for free tier)
  Future<bool> canCheckToday() async {
    final plan = await getCurrentPlan();
    if (plan != SubscriptionPlan.free) return true;

    final today = DateTime.now().toIso8601String().split('T')[0];
    final lastCheckDate = _prefs.getString('last_check_date');
    final checkCount = _prefs.getInt('daily_check_count') ?? 0;

    if (lastCheckDate != today) {
      await _prefs.setString('last_check_date', today);
      await _prefs.setInt('daily_check_count', 0);
      return true;
    }

    // Free tier: 3 checks per day
    return checkCount < 3;
  }

  /// Increment daily check count
  Future<void> incrementCheckCount() async {
    final count = (_prefs.getInt('daily_check_count') ?? 0) + 1;
    await _prefs.setInt('daily_check_count', count);
  }

  /// Subscribe to a plan
  Future<bool> subscribe(SubscriptionPlan plan) async {
    try {
      final response = await _dio.post(
        '$baseUrl/billing/subscribe',
        data: {'plan': plan.toString().split('.').last},
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
