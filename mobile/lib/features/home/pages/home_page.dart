import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/session_models.dart';
import '../../../models/triage_models.dart';
import '../../../widgets/health_profile_gate.dart';
import '../../profile/providers/health_profile_provider.dart';
import '../providers/sessions_provider.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Refresh sessions when page is first loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.invalidate(sessionsProvider);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Refresh sessions when app comes back to foreground
    if (state == AppLifecycleState.resumed) {
      ref.invalidate(sessionsProvider);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              l10n.appName,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            Text(
              l10n.appTagline,
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
        backgroundColor: AppTheme.cardBackground, // White background (not yellow)
        foregroundColor: AppTheme.textPrimary, // Dark text
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
                  onTap: () async {
                    // Check health profile before allowing triage
                    final isComplete = await ref.read(healthProfileCompleteProvider.future);
                    if (isComplete != true) {
                      if (mounted) {
                        context.push('/health-profile');
                      }
                      return;
                    }
                    
                    final sessionId = const Uuid().v4();
                    await context.push('/chat?sessionId=$sessionId');
                    // Refresh sessions when returning from chat
                    if (mounted) {
                      ref.invalidate(sessionsProvider);
                    }
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
              // Recent sessions
              Text(
                'ประวัติการตรวจ',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 16),
              Expanded(
                child: Consumer(
                  builder: (context, ref, child) {
                    final sessionsAsync = ref.watch(sessionsProvider);
                    
                    return sessionsAsync.when(
                      data: (sessions) {
                        if (sessions.isEmpty) {
                          return Center(
                            child: Text(
                              l10n.translate('no_recent_sessions'),
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontSize: 16,
                              ),
                            ),
                          );
                        }
                        
                        return RefreshIndicator(
                          onRefresh: () async {
                            ref.invalidate(sessionsProvider);
                          },
                          child: ListView.builder(
                            itemCount: sessions.length,
                            itemBuilder: (context, index) {
                              final session = sessions[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                child: ListTile(
                                  leading: _getTriageIcon(session.triageLevel),
                                  title: Text(
                                    session.symptoms.isNotEmpty 
                                        ? session.symptoms.first 
                                        : 'ไม่มีอาการ',
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  subtitle: Text(
                                    '${_formatDate(session.createdAt)} • ${_getTriageLabel(session.triageLevel)}',
                                  ),
                                  trailing: const Icon(Icons.chevron_right),
                                  onTap: () {
                                    context.push('/summary?sessionId=${session.sessionId}');
                                  },
                                ),
                              );
                            },
                          ),
                        );
                      },
                      loading: () => const Center(
                        child: CircularProgressIndicator(),
                      ),
                      error: (error, stack) => Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline, size: 48, color: Colors.red),
                            const SizedBox(height: 16),
                            Text(
                              'เกิดข้อผิดพลาด: $error',
                              style: const TextStyle(color: Colors.red),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () {
                                ref.invalidate(sessionsProvider);
                              },
                              child: const Text('ลองอีกครั้ง'),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'หน้าแรก',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat),
            label: 'แชทแพทย์ AI',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'โปรไฟล์',
          ),
        ],
        onTap: (index) {
          if (index == 1) {
            // Start new chat session
            final sessionId = const Uuid().v4();
            context.push('/chat?sessionId=$sessionId');
          } else if (index == 2) {
            context.push('/profile');
          }
        },
      ),
    );
  }
  
  Widget _getTriageIcon(String triageLevel) {
    switch (triageLevel) {
      case 'emergency':
        return const Icon(Icons.warning, color: Colors.red, size: 32);
      case 'gp':
        return const Icon(Icons.local_hospital, color: Colors.orange, size: 32);
      case 'pharmacy':
        return const Icon(Icons.medication, color: Colors.blue, size: 32);
      case 'self_care':
        return const Icon(Icons.home, color: Colors.green, size: 32);
      default:
        return const Icon(Icons.help, color: Colors.grey, size: 32);
    }
  }
  
  String _getTriageLabel(String triageLevel) {
    switch (triageLevel) {
      case 'emergency':
        return 'ฉุกเฉิน';
      case 'gp':
        return 'พบแพทย์';
      case 'pharmacy':
        return 'ร้านยา';
      case 'self_care':
        return 'ดูแลเอง';
      default:
        return 'ไม่แน่ใจ';
    }
  }
  
  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'วันนี้';
    } else if (difference.inDays == 1) {
      return 'เมื่อวาน';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} วันที่แล้ว';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
