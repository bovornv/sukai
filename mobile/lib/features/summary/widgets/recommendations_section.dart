import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/triage_models.dart';

class RecommendationsSection extends StatelessWidget {
  final Recommendations recommendations;

  const RecommendationsSection({
    super.key,
    required this.recommendations,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildSection(
          context,
          l10n.translate('home_care'),
          recommendations.homeCare,
          Icons.home,
          AppTheme.green,
        ),
        const SizedBox(height: 16),
        _buildSection(
          context,
          l10n.translate('otc_meds'),
          recommendations.otcMeds,
          Icons.medication,
          AppTheme.yellow,
        ),
        const SizedBox(height: 16),
        _buildSection(
          context,
          l10n.translate('when_to_see_doctor'),
          recommendations.whenToSeeDoctor,
          Icons.local_hospital,
          AppTheme.yellow,
        ),
        const SizedBox(height: 16),
        _buildSection(
          context,
          l10n.translate('danger_signs'),
          recommendations.dangerSigns,
          Icons.warning,
          AppTheme.red,
        ),
        const SizedBox(height: 16),
        _buildSection(
          context,
          l10n.translate('additional_advice'),
          recommendations.additionalAdvice,
          Icons.lightbulb,
          AppTheme.primaryYellow,
        ),
      ],
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    List<String> items,
    IconData icon,
    Color color,
  ) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 6, right: 8),
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          item,
                          style: const TextStyle(
                            fontSize: 15,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
