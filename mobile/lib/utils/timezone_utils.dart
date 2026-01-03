import 'package:intl/intl.dart';

/// Timezone Utilities
/// Converts UTC timestamps to Thailand timezone (UTC+7) for display
class TimezoneUtils {
  /// Thailand timezone offset (UTC+7)
  static const int thailandOffsetHours = 7;

  /// Convert UTC DateTime to Thailand timezone (UTC+7)
  /// 
  /// [utcDateTime] - DateTime in UTC
  /// Returns DateTime adjusted to Thailand timezone
  static DateTime toThailandTime(DateTime utcDateTime) {
    // DateTime.parse() already parses UTC timestamps correctly
    // But we need to add 7 hours to convert to Thailand time
    return utcDateTime.add(const Duration(hours: thailandOffsetHours));
  }

  /// Format DateTime for display in Thailand timezone
  /// 
  /// [dateTime] - DateTime (can be UTC or local)
  /// [isThai] - Whether to use Thai language format
  /// [includeTime] - Whether to include time in format
  /// Returns formatted string in Thailand timezone
  static String formatThailandTime(
    DateTime dateTime, {
    bool isThai = true,
    bool includeTime = true,
  }) {
    final thailandTime = toThailandTime(dateTime);
    
    if (includeTime) {
      if (isThai) {
        return DateFormat('d MMM yyyy HH:mm น.', 'th_TH').format(thailandTime);
      } else {
        return DateFormat('MMM d, yyyy HH:mm').format(thailandTime);
      }
    } else {
      if (isThai) {
        return DateFormat('d MMM yyyy', 'th_TH').format(thailandTime);
      } else {
        return DateFormat('MMM d, yyyy').format(thailandTime);
      }
    }
  }

  /// Format relative time (e.g., "2 hours ago") in Thailand timezone
  /// 
  /// [dateTime] - DateTime (can be UTC or local)
  /// [isThai] - Whether to use Thai language
  /// Returns relative time string
  static String formatRelativeTime(DateTime dateTime, {bool isThai = true}) {
    final thailandTime = toThailandTime(dateTime);
    final now = DateTime.now();
    final difference = now.difference(thailandTime);

    if (difference.inMinutes < 1) {
      return isThai ? 'เมื่อสักครู่' : 'Just now';
    } else if (difference.inMinutes < 60) {
      return isThai
          ? '${difference.inMinutes} นาทีที่แล้ว'
          : '${difference.inMinutes} minutes ago';
    } else if (difference.inHours < 24) {
      return isThai
          ? '${difference.inHours} ชั่วโมงที่แล้ว'
          : '${difference.inHours} hours ago';
    } else if (difference.inDays < 7) {
      return isThai
          ? '${difference.inDays} วันที่แล้ว'
          : '${difference.inDays} days ago';
    } else {
      return formatThailandTime(dateTime, isThai: isThai, includeTime: false);
    }
  }
}

