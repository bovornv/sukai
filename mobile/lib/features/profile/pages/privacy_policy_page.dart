import 'package:flutter/material.dart';
import '../../../app/theme.dart';

class PrivacyPolicyPage extends StatelessWidget {
  const PrivacyPolicyPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('นโยบายความเป็นส่วนตัว'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'นโยบายความเป็นส่วนตัวของ SukAI',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 24),
            _buildBulletPoint('SukAI ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้'),
            const SizedBox(height: 16),
            const Text(
              'ข้อมูลที่เก็บ ใช้เพื่อ:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _buildBulletPoint('ประเมินอาการเบื้องต้น'),
            _buildBulletPoint('ปรับคำแนะนำให้เหมาะกับผู้ใช้'),
            const SizedBox(height: 16),
            _buildBulletPoint('ข้อมูลสุขภาพจะไม่ถูกขายหรือเผยแพร่ให้บุคคลที่สาม'),
            _buildBulletPoint('ผู้ใช้สามารถขอดู แก้ไข หรือขอลบข้อมูลได้'),
            _buildBulletPoint('ระบบมีการป้องกันข้อมูลตามมาตรฐานความปลอดภัย'),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.backgroundColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'หากมีคำถามเพิ่มเติม ติดต่อทีม SukAI ได้ทุกเมื่อ',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 8, right: 12),
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: AppTheme.textPrimary,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 15,
                color: AppTheme.textPrimary,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

