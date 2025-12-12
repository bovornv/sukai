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
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          context.push('/followup?sessionId=${widget.sessionId}');
                        },
                        child: const Text('ติดตามอาการ'),
                      ),
                    ],
                  ),
                ),
    );
  }
}
