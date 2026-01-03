import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../../app/theme.dart';
import '../../../utils/timezone_utils.dart';
import '../../../l10n/app_localizations.dart';
import '../../../providers/language_provider.dart';
import '../../../models/session_models.dart';
import '../../../models/triage_models.dart';
import '../../home/providers/sessions_provider.dart';
import '../../../widgets/app_bottom_navigation.dart';

class HistoryPage extends ConsumerWidget {
  const HistoryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final isThai = ref.watch(languageProvider).languageCode == 'th';
    final sessionsAsync = ref.watch(sessionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('history_title')),
        backgroundColor: AppTheme.cardBackground,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0,
        actions: [
          IconButton(
            icon: Text(
              isThai ? 'EN' : 'TH',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
              ),
            ),
            onPressed: () {
              ref.read(languageProvider.notifier).toggleLanguage();
            },
            tooltip: isThai ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย',
          ),
        ],
      ),
      body: SafeArea(
        child: sessionsAsync.when(
          data: (sessions) {
            if (sessions.isEmpty) {
              return _buildEmptyState(context, l10n, isThai);
            }
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Subtext below AppBar
                  Text(
                    l10n.translate('history_subtext'),
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Section 1: Health Overview
                  _buildHealthOverviewCard(context, sessions, l10n, isThai),
                  const SizedBox(height: 32),
                  
                  // Section 2: Symptom Timeline
                  _buildSymptomTimeline(context, sessions, l10n, isThai),
                  const SizedBox(height: 32),
                  
                  // Section 3: Pattern Insights
                  _buildPatternInsights(context, sessions, l10n, isThai),
                  const SizedBox(height: 32),
                  
                  // Section 4: Emergency Records (conditional)
                  _buildEmergencyRecords(context, sessions, l10n, isThai),
                  const SizedBox(height: 32),
                  
                  // Section 5: Export/Share (future-ready)
                  _buildExportShareSection(context, l10n, isThai),
                ],
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) => Center(
            child: Text(
              l10n.translate('error_loading_data'),
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
          ),
        ),
      ),
      bottomNavigationBar: const AppBottomNavigation(
        currentIndex: 1, // History tab is active
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, AppLocalizations l10n, bool isThai) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 80),
          // Soft abstract health icon
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: AppTheme.primarySoft,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.health_and_safety_outlined,
              size: 64,
              color: AppTheme.primary,
            ),
          ),
          const SizedBox(height: 32),
          Text(
            l10n.translate('history_empty_title'),
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            l10n.translate('history_empty_subtitle'),
            style: TextStyle(
              fontSize: 15,
              color: AppTheme.textSecondary,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                // Navigate to chat to start assessment
                final sessionId = const Uuid().v4();
                context.push('/chat?sessionId=$sessionId');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                l10n.translate('history_empty_cta'),
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthOverviewCard(
    BuildContext context,
    List<TriageSession> sessions,
    AppLocalizations l10n,
    bool isThai,
  ) {
    // Filter sessions from last 30 days
    final now = DateTime.now();
    final thirtyDaysAgo = now.subtract(const Duration(days: 30));
    final recentSessions = sessions.where((s) => s.createdAt.isAfter(thirtyDaysAgo)).toList();
    
    // Count by triage level
    int selfCareCount = 0;
    int gpCount = 0;
    int emergencyCount = 0;
    
    for (final session in recentSessions) {
      final level = TriageLevel.fromString(session.triageLevel);
      if (level == TriageLevel.selfCare) {
        selfCareCount++;
      } else if (level == TriageLevel.gp) {
        gpCount++;
      } else if (level == TriageLevel.emergency) {
        emergencyCount++;
      }
    }
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppTheme.borderLight,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.translate('history_overview_title'),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 16),
          _buildStatRow(
            l10n.translate('history_overview_total'),
            '${recentSessions.length}',
            l10n.translate('history_overview_total_unit'),
            isThai,
          ),
          const SizedBox(height: 12),
          _buildStatRow(
            l10n.translate('history_overview_selfcare'),
            '$selfCareCount',
            '',
            isThai,
          ),
          const SizedBox(height: 12),
          _buildStatRow(
            l10n.translate('history_overview_gp'),
            '$gpCount',
            '',
            isThai,
          ),
          const SizedBox(height: 12),
          _buildStatRow(
            l10n.translate('history_overview_emergency'),
            '$emergencyCount',
            '',
            isThai,
          ),
          const SizedBox(height: 16),
          Text(
            l10n.translate('history_overview_note'),
            style: TextStyle(
              fontSize: 13,
              color: AppTheme.textTertiary,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatRow(String label, String value, String unit, bool isThai) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 15,
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w400,
          ),
        ),
        Text(
          unit.isNotEmpty ? '$value $unit' : value,
          style: const TextStyle(
            fontSize: 15,
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildSymptomTimeline(
    BuildContext context,
    List<TriageSession> sessions,
    AppLocalizations l10n,
    bool isThai,
  ) {
    // Group sessions by date
    final groupedSessions = <String, List<TriageSession>>{};
    
    for (final session in sessions) {
      final dateKey = _getDateKey(session.createdAt, isThai);
      if (!groupedSessions.containsKey(dateKey)) {
        groupedSessions[dateKey] = [];
      }
      groupedSessions[dateKey]!.add(session);
    }
    
    // Sort dates (newest first)
    final sortedDates = groupedSessions.keys.toList()
      ..sort((a, b) {
        // Parse dates for sorting
        final dateA = _parseDateKey(a, isThai);
        final dateB = _parseDateKey(b, isThai);
        return dateB.compareTo(dateA);
      });
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.translate('history_timeline_title'),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        ...sortedDates.map((dateKey) {
          final dateSessions = groupedSessions[dateKey]!;
          return Padding(
            padding: const EdgeInsets.only(bottom: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date label
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      Text(
                        '📅',
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        dateKey,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                // Sessions for this date
                ...dateSessions.map((session) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildTimelineItem(context, session, l10n, isThai),
                  );
                }),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildTimelineItem(
    BuildContext context,
    TriageSession session,
    AppLocalizations l10n,
    bool isThai,
  ) {
    final symptom = session.symptoms.isNotEmpty 
        ? session.symptoms.first 
        : (isThai ? 'ไม่มีอาการ' : 'No symptom');
    final level = TriageLevel.fromString(session.triageLevel);
    final icon = _getTriageIcon(level);
    final levelText = _getTriageLevelText(level, l10n);
    final isToday = _isToday(session.createdAt);
    
    return InkWell(
      onTap: () {
        context.push('/summary?sessionId=${session.sessionId}');
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppTheme.borderLight,
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          children: [
            // Icon
            Text(
              icon,
              style: const TextStyle(fontSize: 20),
            ),
            const SizedBox(width: 12),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    symptom,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    levelText,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  if (isToday) ...[
                    const SizedBox(height: 4),
                    Text(
                      _formatTime(session.createdAt, isThai),
                      style: TextStyle(
                        fontSize: 13,
                        color: AppTheme.textTertiary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            // Link
            Text(
              l10n.translate('history_view_details'),
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.chevron_right,
              size: 16,
              color: AppTheme.primary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPatternInsights(
    BuildContext context,
    List<TriageSession> sessions,
    AppLocalizations l10n,
    bool isThai,
  ) {
    // Detect repeated symptoms (2+ times)
    final symptomCounts = <String, int>{};
    final symptomDates = <String, List<DateTime>>{};
    
    for (final session in sessions) {
      for (final symptom in session.symptoms) {
        symptomCounts[symptom] = (symptomCounts[symptom] ?? 0) + 1;
        if (!symptomDates.containsKey(symptom)) {
          symptomDates[symptom] = [];
        }
        symptomDates[symptom]!.add(session.createdAt);
      }
    }
    
    // Filter to only symptoms that appear 2+ times
    final repeatedSymptoms = symptomCounts.entries
        .where((entry) => entry.value >= 2)
        .toList()
      ..sort((a, b) => b.value.compareTo(a.value)); // Sort by frequency
    
    if (repeatedSymptoms.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.translate('history_patterns_title'),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        ...repeatedSymptoms.map((entry) {
          final symptom = entry.key;
          final count = entry.value;
          final dates = symptomDates[symptom]!;
          final timeSpan = _calculateTimeSpan(dates, isThai);
          
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.cardBackground,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.borderLight,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                const Text('•', style: TextStyle(fontSize: 16)),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    isThai
                        ? '$symptom — พบ $count ครั้ง$timeSpan'
                        : '$symptom — $count times$timeSpan',
                    style: const TextStyle(
                      fontSize: 15,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 8),
        Text(
          l10n.translate('history_patterns_note'),
          style: TextStyle(
            fontSize: 13,
            color: AppTheme.textTertiary,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }

  Widget _buildEmergencyRecords(
    BuildContext context,
    List<TriageSession> sessions,
    AppLocalizations l10n,
    bool isThai,
  ) {
    final emergencySessions = sessions
        .where((s) => TriageLevel.fromString(s.triageLevel) == TriageLevel.emergency)
        .toList();
    
    if (emergencySessions.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.translate('history_emergency_title'),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        ...emergencySessions.map((session) {
          final symptom = session.symptoms.isNotEmpty
              ? session.symptoms.first
              : (isThai ? 'ไม่มีอาการ' : 'No symptom');
          final date = _formatDate(session.createdAt, isThai);
          
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.cardBackground,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.statusEmergency.withValues(alpha: 0.3),
                width: 2,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('🚨', style: TextStyle(fontSize: 20)),
                    const SizedBox(width: 8),
                    Text(
                      date,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  isThai ? 'อาการ: $symptom' : 'Symptom: $symptom',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  l10n.translate('history_emergency_recommendation'),
                  style: TextStyle(
                    fontSize: 15,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _buildExportShareSection(
    BuildContext context,
    AppLocalizations l10n,
    bool isThai,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.translate('history_export_title'),
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 16),
        // Share with doctor button (inactive/future)
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: null, // Disabled for now
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              l10n.translate('history_export_share'),
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Download PDF button (inactive/future)
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: null, // Disabled for now
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              l10n.translate('history_export_download'),
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Helper methods
  String _getTriageIcon(TriageLevel level) {
    switch (level) {
      case TriageLevel.selfCare:
        return '🟢';
      case TriageLevel.gp:
        return '🟡';
      case TriageLevel.emergency:
        return '🔴';
      default:
        return '⚪';
    }
  }

  String _getTriageLevelText(TriageLevel level, AppLocalizations l10n) {
    switch (level) {
      case TriageLevel.selfCare:
        return l10n.translate('history_level_selfcare');
      case TriageLevel.gp:
        return l10n.translate('history_level_gp');
      case TriageLevel.emergency:
        return l10n.translate('history_level_emergency');
      default:
        return l10n.translate('history_level_uncertain');
    }
  }

  String _getDateKey(DateTime date, bool isThai) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateOnly = DateTime(date.year, date.month, date.day);
    
    if (dateOnly == today) {
      return isThai ? 'วันนี้' : 'Today';
    } else if (dateOnly == yesterday) {
      return isThai ? 'เมื่อวาน' : 'Yesterday';
    } else {
      return _formatDate(date, isThai);
    }
  }

  DateTime _parseDateKey(String dateKey, bool isThai) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    
    if (dateKey == (isThai ? 'วันนี้' : 'Today')) {
      return today;
    } else if (dateKey == (isThai ? 'เมื่อวาน' : 'Yesterday')) {
      return today.subtract(const Duration(days: 1));
    } else {
      // Parse date string (e.g., "20 ธ.ค. 2025" or "Dec 20, 2025")
      // For now, return today as fallback
      return today;
    }
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  String _formatDate(DateTime date, bool isThai) {
    // Convert UTC to Thailand timezone (UTC+7)
    final thailandTime = TimezoneUtils.toThailandTime(date);
    
    if (isThai) {
      final thaiMonths = [
        '',
        'ม.ค.',
        'ก.พ.',
        'มี.ค.',
        'เม.ย.',
        'พ.ค.',
        'มิ.ย.',
        'ก.ค.',
        'ส.ค.',
        'ก.ย.',
        'ต.ค.',
        'พ.ย.',
        'ธ.ค.'
      ];
      return '${thailandTime.day} ${thaiMonths[thailandTime.month]} ${thailandTime.year}';
    } else {
      return DateFormat('MMM d, yyyy').format(thailandTime);
    }
  }

  String _formatTime(DateTime date, bool isThai) {
    // Convert UTC to Thailand timezone (UTC+7)
    final thailandTime = TimezoneUtils.toThailandTime(date);
    final timeFormat = DateFormat('HH:mm');
    final time = timeFormat.format(thailandTime);
    return isThai ? '$time น.' : '$time';
  }

  String _calculateTimeSpan(List<DateTime> dates, bool isThai) {
    if (dates.length < 2) return '';
    
    dates.sort();
    final first = dates.first;
    final last = dates.last;
    final days = last.difference(first).inDays;
    
    if (days < 7) {
      final weeks = (days / 7).ceil();
      return isThai ? ' ใน $weeks สัปดาห์' : ' in $weeks week${weeks > 1 ? 's' : ''}';
    } else {
      return isThai ? ' ใน $days วัน' : ' in $days days';
    }
  }
}

