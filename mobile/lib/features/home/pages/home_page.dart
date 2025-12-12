import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_localizations.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              l10n.appName,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            Text(
              l10n.appTagline,
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              // Main CTA
              Card(
                elevation: 4,
                child: InkWell(
                  onTap: () {
                    final sessionId = const Uuid().v4();
                    context.push('/chat?sessionId=$sessionId');
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      children: [
                        const Text(
                          '🏥',
                          style: TextStyle(fontSize: 64),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          l10n.startCheck,
                          style: Theme.of(context).textTheme.displayMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'บอกอาการของคุณ\nAI จะช่วยประเมินและแนะนำ',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 16, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
              // Recent sessions (placeholder)
              Text(
                'ประวัติการตรวจ',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              Expanded(
                child: Center(
                  child: Text(
                    l10n.translate('no_recent_sessions'),
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'หน้าแรก',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.credit_card),
            label: 'แผนการใช้งาน',
          ),
        ],
        onTap: (index) {
          if (index == 1) {
            context.push('/billing');
          }
        },
      ),
    );
  }
}
