import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../models/triage_models.dart';

class SummaryCard extends StatelessWidget {
  final DiagnosisResponse diagnosis;

  const SummaryCard({
    super.key,
    required this.diagnosis,
  });

  String _getTriageEmoji(TriageLevel level) {
    switch (level) {
      case TriageLevel.selfCare:
        return '💚';
      case TriageLevel.pharmacy:
        return '💊';
      case TriageLevel.gp:
        return '🟡';
      case TriageLevel.emergency:
        return '🔴';
      case TriageLevel.uncertain:
        return '⚠️';
    }
  }

  /// PROBLEM_DRIVEN_IMPLEMENTATION.md: Summary must be 2-4 short lines, emoji-based, calm tone
  /// Must provide: clear triage result, clear next action, clear safety boundary
  List<String> _getSummaryLines(TriageLevel level) {
    switch (level) {
      case TriageLevel.selfCare:
        return [
          '💊 อาการไม่รุนแรง',
          '🏠 ดูแลตัวเองที่บ้านได้',
          '⏰ ติดตามอาการ 24–48 ชม.',
        ];
      case TriageLevel.pharmacy:
        return [
          '💊 สามารถไปร้านยาได้',
          '🏥 อาการไม่รุนแรงมาก',
          '⏰ หากไม่ดีขึ้นใน 2–3 วัน',
        ];
      case TriageLevel.gp:
        return [
          '👨‍⚕️ ควรพบแพทย์',
          '📅 ภายใน 1–2 วัน',
          '📌 เตรียมข้อมูลอาการ',
        ];
      case TriageLevel.emergency:
        return [
          '🚨 อาการฉุกเฉิน',
          '🏥 ไปโรงพยาบาลทันที',
          '⚠️ อย่ารอให้อาการแย่ลง',
        ];
      case TriageLevel.uncertain:
        return [
          '👨‍⚕️ ควรปรึกษาแพทย์',
          '📅 เพื่อประเมินเพิ่มเติม',
          '📝 เตรียมข้อมูลอาการ',
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.getTriageColor(diagnosis.triageLevel.value);
    final severityStatement = diagnosis.severityStatement ?? 
        _getSummaryLines(diagnosis.triageLevel)[0];
    final whyExplanation = diagnosis.whyExplanation ?? 
        'หมอได้ประเมินอาการของคุณแล้ว';

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color, width: 2),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Severity Statement (Traffic Light) - Prominent
            Row(
              children: [
                Text(
                  _getTriageEmoji(diagnosis.triageLevel),
                  style: const TextStyle(fontSize: 40),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    severityStatement,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // WHY Explanation - Reassurance
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_outline, size: 18, color: AppTheme.textSecondary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      whyExplanation,
                      style: const TextStyle(
                        fontSize: 15,
                        height: 1.4,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Action & Follow-up (lines 3-4 from summary)
            Builder(
              builder: (context) {
                final summaryLines = diagnosis.summary.split('\n');
                final actionLines = summaryLines.length > 2 
                    ? summaryLines.sublist(2) 
                    : <String>[];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: actionLines.map((line) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                line,
                                style: const TextStyle(
                                  fontSize: 16,
                                  height: 1.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )).toList(),
                );
              },
            ),
            // Follow-up timing if available
            if (diagnosis.followUp != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryYellow.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.access_time, size: 18, color: AppTheme.textPrimary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '⏰ ติดตามอาการ: ${diagnosis.followUp!.timing}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
