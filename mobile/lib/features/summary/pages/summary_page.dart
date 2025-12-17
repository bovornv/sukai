import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/triage_models.dart';
import '../../../services/triage_service.dart';
import '../widgets/summary_card.dart';
import '../widgets/recommendations_section.dart';

class SummaryPage extends ConsumerStatefulWidget {
  final String sessionId;

  const SummaryPage({
    super.key,
    required this.sessionId,
  });

  @override
  ConsumerState<SummaryPage> createState() => _SummaryPageState();
}

class _SummaryPageState extends ConsumerState<SummaryPage> {
  DiagnosisResponse? _diagnosis;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDiagnosis();
  }

  Future<void> _loadDiagnosis() async {
    try {
      final triageService = TriageService();
      final diagnosis = await triageService.getDiagnosis(
        sessionId: widget.sessionId,
      );
      setState(() {
        _diagnosis = diagnosis;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('summary_title')),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
              : _diagnosis == null
              ? const Center(
                  child: Text(
                    'ไม่พบข้อมูล',
                    style: TextStyle(color: AppTheme.textSecondary),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      SummaryCard(diagnosis: _diagnosis!),
                      const SizedBox(height: 24),
                      RecommendationsSection(
                        recommendations: _diagnosis!.recommendations,
                      ),
                      // Premium Doctor Review suggestion for GP level
                      if (_diagnosis!.triageLevel == TriageLevel.gp) ...[
                        const SizedBox(height: 24),
                        Card(
                          color: AppTheme.green.withValues(alpha: 0.1),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.medical_services, color: AppTheme.green),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        '👨‍⚕️ Premium Doctor Review',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'แพทย์ช่วยตรวจซ้ำจากข้อมูลที่ AI สรุปแล้ว\nประหยัดเวลาและค่าใช้จ่าย',
                                  style: TextStyle(
                                    fontSize: 14,
                                    height: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton(
                                    onPressed: () {
                                      context.push('/profile');
                                    },
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: AppTheme.green),
                                      foregroundColor: AppTheme.green,
                                    ),
                                    child: const Text('ดูแผน Premium Doctor'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      // Follow-up reminder section
                      if (_diagnosis!.followUp != null) ...[
                        const SizedBox(height: 24),
                        Card(
                          color: AppTheme.primaryYellow.withValues(alpha: 0.1),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(Icons.notifications_active, color: AppTheme.textPrimary, size: 24), // Dark icon for visibility
                                    const SizedBox(width: 8),
                                    const Text(
                                      '⏰ ติดตามอาการ',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: AppTheme.textPrimary, // Dark text
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'ระยะเวลาติดตาม: ${_diagnosis!.followUp!.timing}',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('❗ ', style: TextStyle(fontSize: 16)),
                                    Expanded(
                                      child: Text(
                                        'สัญญาณที่ต้องกลับมาเช็ค: ${_diagnosis!.followUp!.watchSigns}',
                                        style: const TextStyle(
                                          fontSize: 14,
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      context.push('/followup?sessionId=${widget.sessionId}');
                                    },
                                    icon: const Icon(Icons.check_circle),
                                    label: const Text('บันทึกการติดตามอาการ'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppTheme.primaryYellow,
                                      foregroundColor: Colors.black,
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ] else ...[
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: () {
                            context.push('/followup?sessionId=${widget.sessionId}');
                          },
                          icon: const Icon(Icons.check_circle),
                          label: const Text('ติดตามอาการ'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }
}
