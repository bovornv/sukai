import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/riverpod.dart' as riverpod;
import '../config/api_config.dart';
import '../features/auth/providers/auth_provider.dart';

/// Notification Response Enum
enum NotificationResponse {
  improved('improved'),
  same('same'),
  worse('worse'),
  unsure('unsure'),
  skip('skip'),
  reassess('reassess'),
  doctor('doctor');
  
  final String value;
  const NotificationResponse(this.value);
}

/// Notification Model
class NotificationModel {
  final String id;
  final String sessionId;
  final String? userId;
  final String notificationType; // '24h', '48h', 'safety'
  final DateTime scheduledAt;
  final DateTime? sentAt;
  final DateTime? respondedAt;
  final NotificationResponse? response;
  final bool dismissed;
  final String? symptom;
  final bool hasRedFlags;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.sessionId,
    this.userId,
    required this.notificationType,
    required this.scheduledAt,
    this.sentAt,
    this.respondedAt,
    this.response,
    required this.dismissed,
    this.symptom,
    required this.hasRedFlags,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      userId: json['user_id'] as String?,
      notificationType: json['notification_type'] as String,
      scheduledAt: DateTime.parse(json['scheduled_at'] as String),
      sentAt: json['sent_at'] != null ? DateTime.parse(json['sent_at'] as String) : null,
      respondedAt: json['responded_at'] != null ? DateTime.parse(json['responded_at'] as String) : null,
      response: json['response'] != null ? _parseResponse(json['response'] as String) : null,
      dismissed: json['dismissed'] as bool? ?? false,
      symptom: json['symptom'] as String?,
      hasRedFlags: json['has_red_flags'] as bool? ?? false,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  static NotificationResponse? _parseResponse(String value) {
    try {
      return NotificationResponse.values.firstWhere(
        (e) => e.value == value,
      );
    } catch (e) {
      return null;
    }
  }

  bool get isPending => sentAt == null && !dismissed;
  bool get isResponded => respondedAt != null;
}

/// Notification Service
/// Handles fetching and responding to follow-up notifications
class NotificationService {
  final Dio _dio;
  final String baseUrl;
  final riverpod.Ref? _ref;
  
  NotificationService({
    Dio? dio,
    String? baseUrl,
    riverpod.Ref? ref,
  })  : _dio = dio ?? Dio(),
        baseUrl = baseUrl ?? ApiConfig.privateBaseUrl,
        _ref = ref;
  
  /// Get user's pending notifications
  Future<List<NotificationModel>> getPendingNotifications() async {
    try {
      final userId = _ref != null ? (_ref as ProviderRef).read(authProvider).userId : null;
      
      if (userId == null) {
        return [];
      }
      
      final headers = <String, String>{};
      headers['x-user-id'] = userId;
      
      final response = await _dio.get(
        '$baseUrl/notifications/user',
        options: Options(headers: headers),
      );
      
      if (response.data['success'] == true) {
        final notifications = response.data['notifications'] as List?;
        if (notifications != null) {
          return notifications
              .map((n) => NotificationModel.fromJson(n as Map<String, dynamic>))
              .toList();
        }
      }
      
      return [];
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      return [];
    }
  }
  
  /// Respond to a notification
  Future<bool> respondToNotification(String notificationId, NotificationResponse response) async {
    try {
      final userId = _ref != null ? (_ref as ProviderRef).read(authProvider).userId : null;
      
      final headers = <String, String>{};
      if (userId != null) {
        headers['x-user-id'] = userId;
      }
      
      await _dio.post(
        '$baseUrl/notifications/$notificationId/respond',
        data: {
          'response': response.value,
        },
        options: Options(headers: headers),
      );
      
      return true;
    } catch (e) {
      debugPrint('Error responding to notification: $e');
      return false;
    }
  }
  
  /// Dismiss a notification
  Future<bool> dismissNotification(String notificationId) async {
    try {
      final userId = _ref != null ? (_ref as ProviderRef).read(authProvider).userId : null;
      
      final headers = <String, String>{};
      if (userId != null) {
        headers['x-user-id'] = userId;
      }
      
      await _dio.post(
        '$baseUrl/notifications/$notificationId/dismiss',
        options: Options(headers: headers),
      );
      
      return true;
    } catch (e) {
      debugPrint('Error dismissing notification: $e');
      return false;
    }
  }
}

