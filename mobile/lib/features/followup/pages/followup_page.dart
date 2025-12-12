import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../l10n/app_localizations.dart';

enum SymptomStatus {
  better,
  same,
  worse,
}

class FollowupPage extends ConsumerStatefulWidget {
  final String sessionId;

  const FollowupPage({
    super.key,
    required this.sessionId,
  });

  @override
  ConsumerState<FollowupPage> createState() => _FollowupPageState();
}

class _FollowupPageState extends ConsumerState<FollowupPage> {
  SymptomStatus? _selectedStatus;
  final TextEditingController _notesController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _submitFollowup() {
    if (_selectedStatus == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('กรุณาเลือกสถานะอาการ')),
      );
      return;
    }

    // Save follow-up data
    // In production, send to backend
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('บันทึกข้อมูลแล้ว')),
    );
    
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('followup_title')),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const Text(
                      '📊',
                      style: TextStyle(fontSize: 48),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      l10n.translate('how_are_you_feeling'),
                      style: Theme.of(context).textTheme.titleLarge,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            // PROBLEM_DRIVEN_IMPLEMENTATION.md: Follow-up UI must be one-tap: ดีขึ้น / เท่าเดิม / แย่ลง
            _buildStatusOption(
              context,
              SymptomStatus.better,
              'ดีขึ้น',
              '📈',
              AppTheme.green,
            ),
            const SizedBox(height: 12),
            _buildStatusOption(
              context,
              SymptomStatus.same,
              'เท่าเดิม',
              '➡️',
              AppTheme.yellow,
            ),
            const SizedBox(height: 12),
            _buildStatusOption(
              context,
              SymptomStatus.worse,
              'แย่ลง',
              '📉',
              AppTheme.red,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'หมายเหตุเพิ่มเติม (ไม่บังคับ)',
                hintText: 'บอกเพิ่มเติมเกี่ยวกับอาการ...',
                border: OutlineInputBorder(),
              ),
              maxLines: 4,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _submitFollowup,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('บันทึก'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusOption(
    BuildContext context,
    SymptomStatus status,
    String label,
    String emoji,
    Color color,
  ) {
    final isSelected = _selectedStatus == status;

    return InkWell(
      onTap: () {
        setState(() {
          _selectedStatus = status;
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.2) : Colors.white,
          border: Border.all(
            color: isSelected ? color : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 32)),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: color),
          ],
        ),
      ),
    );
  }
}
