import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../../app/theme.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../services/billing_service.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  BillingService? _billingService;
  SubscriptionPlan? _currentPlan;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initializeService();
  }

  Future<void> _initializeService() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _billingService = BillingService(prefs: prefs);
    });
    _loadCurrentPlan();
  }

  Future<void> _loadCurrentPlan() async {
    if (_billingService == null) return;
    final plan = await _billingService!.getCurrentPlan();
    setState(() {
      _currentPlan = plan;
      _isLoading = false;
    });
  }

  Future<void> _subscribe(SubscriptionPlan plan) async {
    if (_billingService == null) return;
    
    setState(() {
      _isLoading = true;
    });

    final success = await _billingService!.subscribe(plan);
    
    setState(() {
      _isLoading = false;
    });

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('สมัครสมาชิก ${_getPlanName(plan)} สำเร็จ')),
      );
      _loadCurrentPlan();
    }
  }

  String _getPlanName(SubscriptionPlan plan) {
    switch (plan) {
      case SubscriptionPlan.free:
        return 'ฟรี';
      case SubscriptionPlan.pro:
        return 'Pro';
      case SubscriptionPlan.premiumDoctor:
        return 'Premium Doctor';
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ออกจากระบบ'),
        content: const Text('คุณต้องการออกจากระบบหรือไม่?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('ยกเลิก'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ออกจากระบบ'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final authNotifier = ref.read(authProvider.notifier);
      await authNotifier.signOut();
      if (mounted) {
        context.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('โปรไฟล์'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User Info Section
            _buildSection(
              context,
              '👤 ข้อมูลผู้ใช้',
              [
                _buildInfoRow('อีเมล', user?.email ?? '-'),
                _buildInfoRow('ชื่อ', user?.userMetadata?['full_name'] ?? '-'),
              ],
            ),
            const SizedBox(height: 24),

            // Health Profile Section
            _buildSection(
              context,
              '🩺 ข้อมูลสุขภาพ',
              [
                _buildInfoRow('อายุ', '-'),
                _buildInfoRow('โรคประจำตัว', '-'),
                _buildInfoRow('แพ้ยา', '-'),
                const SizedBox(height: 8),
                TextButton.icon(
                  onPressed: () {
                    // TODO: Navigate to health profile edit page
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้')),
                    );
                  },
                  icon: const Icon(Icons.edit),
                  label: const Text('แก้ไขข้อมูลสุขภาพ'),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Plan & Billing Section
            _buildSection(
              context,
              '💳 แผนบริการของฉัน',
              [
                if (_isLoading)
                  const Center(child: CircularProgressIndicator())
                else ...[
                  if (_currentPlan != null)
                    Card(
                      color: AppTheme.primaryYellow.withValues(alpha: 0.2),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle, color: AppTheme.green),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'แผนปัจจุบัน: ${_getPlanName(_currentPlan!)}',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                  _buildPlanCard(
                    context,
                    SubscriptionPlan.free,
                    'ฟรี',
                    '฿0',
                    [
                      'ตรวจอาการพื้นฐาน',
                      'การประเมินเบื้องต้น',
                      'สรุปผลการประเมิน',
                      'จำกัด 3 ครั้ง/วัน',
                    ],
                    Colors.grey,
                    _currentPlan == SubscriptionPlan.free,
                  ),
                  const SizedBox(height: 12),
                  _buildPlanCard(
                    context,
                    SubscriptionPlan.pro,
                    'Pro',
                    '฿99/เดือน',
                    [
                      'ตรวจไม่จำกัด',
                      'คำแนะนำแบบละเอียด',
                      'คำแนะนำการใช้ยา',
                      'ติดตามอาการ',
                    ],
                    AppTheme.yellow,
                    _currentPlan == SubscriptionPlan.pro,
                  ),
                  const SizedBox(height: 12),
                  _buildPlanCard(
                    context,
                    SubscriptionPlan.premiumDoctor,
                    'Premium Doctor',
                    '฿299/ครั้ง',
                    [
                      'ตรวจสอบโดยแพทย์',
                      'บันทึกจากแพทย์',
                      'ลำดับความสำคัญ',
                      'แชร์ครอบครัว (จำกัด)',
                    ],
                    AppTheme.green,
                    _currentPlan == SubscriptionPlan.premiumDoctor,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 24),

            // Privacy & Legal Section
            _buildSection(
              context,
              '🔒 ความเป็นส่วนตัว & PDPA',
              [
                _buildListTile(
                  context,
                  'นโยบายความเป็นส่วนตัว',
                  Icons.privacy_tip,
                  () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('นโยบายความเป็นส่วนตัว')),
                    );
                  },
                ),
                _buildListTile(
                  context,
                  'ข้อกำหนดการใช้งาน',
                  Icons.description,
                  () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('ข้อกำหนดการใช้งาน')),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Medical Disclaimer Section
            _buildSection(
              context,
              '📄 ข้อจำกัดทางการแพทย์',
              [
                const Text(
                  'SukAI เป็นเครื่องมือช่วยประเมินอาการเบื้องต้นเท่านั้น ไม่สามารถแทนที่การวินิจฉัยจากแพทย์ได้ กรุณาปรึกษาแพทย์หากมีอาการรุนแรงหรือไม่แน่ใจ',
                  style: TextStyle(fontSize: 14, color: AppTheme.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Help & FAQ Section
            _buildSection(
              context,
              '❓ ศูนย์ช่วยเหลือ',
              [
                _buildListTile(
                  context,
                  'คำถามที่พบบ่อย (FAQ)',
                  Icons.help_outline,
                  () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('คำถามที่พบบ่อย')),
                    );
                  },
                ),
                _buildListTile(
                  context,
                  'ติดต่อฝ่ายสนับสนุน',
                  Icons.support_agent,
                  () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('ติดต่อฝ่ายสนับสนุน')),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Logout Section
            _buildSection(
              context,
              '🚪 ออกจากระบบ',
              [
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _handleLogout,
                    icon: const Icon(Icons.logout),
                    label: const Text('ออกจากระบบ'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 2,
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
          if (index == 0) {
            context.go('/');
          } else if (index == 1) {
            final sessionId = const Uuid().v4();
            context.push('/chat?sessionId=$sessionId');
          }
        },
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListTile(
    BuildContext context,
    String title,
    IconData icon,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Icon(icon, color: AppTheme.primaryYellow),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
    );
  }

  Widget _buildPlanCard(
    BuildContext context,
    SubscriptionPlan plan,
    String title,
    String price,
    List<String> features,
    Color color,
    bool isCurrent,
  ) {
    return Card(
      elevation: isCurrent ? 4 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isCurrent ? color : Colors.transparent,
          width: 2,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  price,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...features.map((feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      Icon(Icons.check, color: color, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          feature,
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isCurrent
                    ? null
                    : () => _subscribe(plan),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isCurrent ? Colors.grey : color,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
                child: Text(
                  isCurrent ? 'แผนปัจจุบัน' : 'สมัครสมาชิก',
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

