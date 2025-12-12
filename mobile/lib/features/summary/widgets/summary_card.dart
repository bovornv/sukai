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
    final lines = _getSummaryLines(diagnosis.triageLevel);

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
            Row(
              children: [
                Text(
                  _getTriageEmoji(diagnosis.triageLevel),
                  style: const TextStyle(fontSize: 32),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    diagnosis.summary,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...lines.map((line) => Padding(
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
                )),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, size: 16),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'นี่หมายความว่าอย่างไร: หมอได้ประเมินอาการของคุณแล้ว และแนะนำขั้นตอนต่อไป',
                      style: TextStyle(fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
