import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/api_config.dart';
import '../features/auth/providers/auth_provider.dart';

/// Push Notification Service
/// Handles FCM token registration and notification handling
class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();
  
  bool _initialized = false;
  
  /// Initialize push notifications
  Future<void> initialize(WidgetRef ref) async {
    if (_initialized) return;
    
    try {
      // Request permission
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      
      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        // Get FCM token
        String? token = await _messaging.getToken();
        if (token != null) {
          await _registerDeviceToken(token, ref);
        }
        
        // Listen for token refresh
        _messaging.onTokenRefresh.listen((newToken) {
          _registerDeviceToken(newToken, ref);
        });
        
        // Configure local notifications
        await _configureLocalNotifications();
        
        // Handle foreground messages
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
          _handleForegroundMessage(message);
        });
        
        // Handle notification taps
        FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
          _handleNotificationTap(message, ref);
        });
        
        // Check if app was opened from notification
        RemoteMessage? initialMessage = await _messaging.getInitialMessage();
        if (initialMessage != null) {
          _handleNotificationTap(initialMessage, ref);
        }
        
        _initialized = true;
      }
    } catch (e) {
      debugPrint('Error initializing push notifications: $e');
    }
  }
  
  /// Register device token with backend
  Future<void> _registerDeviceToken(String token, WidgetRef ref) async {
    try {
      final userId = ref.read(authProvider).userId;
      if (userId == null) return;
      
      final dio = Dio();
      await dio.post(
        '${ApiConfig.privateBaseUrl}/device-tokens/register',
        data: {
          'token': token,
          'platform': _getPlatform(),
          'app_version': '1.0.0', // TODO: Get from package_info_plus
        },
        options: Options(
          headers: {'x-user-id': userId},
        ),
      );
      
      debugPrint('✅ Device token registered: ${token.substring(0, 20)}...');
    } catch (e) {
      debugPrint('Error registering device token: $e');
    }
  }
  
  /// Get platform name
  String _getPlatform() {
    // TODO: Use Platform.isAndroid / Platform.isIOS from dart:io
    return 'android'; // Default, should detect actual platform
  }
  
  /// Configure local notifications
  Future<void> _configureLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle notification tap
        debugPrint('Notification tapped: ${response.payload}');
      },
    );
    
    // Create notification channel for Android
    const androidChannel = AndroidNotificationChannel(
      'sukai_notifications',
      'Suk AI Notifications',
      description: 'Notifications from Suk AI',
      importance: Importance.high,
    );
    
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);
  }
  
  /// Handle foreground messages
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('Foreground message: ${message.messageId}');
    
    // Show local notification
    _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'sukai_notifications',
          'Suk AI Notifications',
          channelDescription: 'Notifications from Suk AI',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: message.data.toString(),
    );
  }
  
  /// Handle notification tap
  void _handleNotificationTap(RemoteMessage message, WidgetRef ref) {
    debugPrint('Notification tapped: ${message.messageId}');
    
    // Navigate based on notification data
    final data = message.data;
    if (data['type'] == 'followup') {
      // Navigate to notifications page or specific notification
      // This requires access to BuildContext, so we'll use a callback
      // or navigate via a global navigator key
    }
  }
  
  /// Unregister device token (on logout)
  Future<void> unregisterToken(String token, WidgetRef ref) async {
    try {
      final userId = ref.read(authProvider).userId;
      if (userId == null) return;
      
      final dio = Dio();
      await dio.delete(
        '${ApiConfig.privateBaseUrl}/device-tokens/$token',
        options: Options(
          headers: {'x-user-id': userId},
        ),
      );
    } catch (e) {
      debugPrint('Error unregistering device token: $e');
    }
  }
}

/// Background message handler (top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('Background message: ${message.messageId}');
  // Handle background messages here
}

/// Provider for PushNotificationService
final pushNotificationServiceProvider = Provider<PushNotificationService>((ref) {
  return PushNotificationService();
});

