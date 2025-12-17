import 'package:flutter/material.dart';
import '../../../app/theme.dart';

class FAQPage extends StatelessWidget {
  const FAQPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('คำถามที่พบบ่อย'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          _buildFAQItem(
            question: 'SukAI ใช้แทนแพทย์ได้หรือไม่?',
            answer: 'ไม่ได้ค่ะ SukAI เป็นเครื่องมือช่วยประเมินอาการเบื้องต้นเท่านั้น ไม่สามารถใช้แทนการวินิจฉัยจากแพทย์ได้ หากมีอาการรุนแรงหรือไม่แน่ใจ ควรพบแพทย์ทันที',
          ),
          const Divider(height: 32),
          _buildFAQItem(
            question: 'ข้อมูลสุขภาพปลอดภัยแค่ไหน?',
            answer: 'SukAI ให้ความสำคัญกับความปลอดภัยของข้อมูล ข้อมูลถูกเก็บอย่างปลอดภัยตามมาตรฐาน และจะไม่ถูกขายหรือเผยแพร่ให้บุคคลที่สาม ผู้ใช้สามารถขอดู แก้ไข หรือลบข้อมูลได้ตลอดเวลา',
          ),
          const Divider(height: 32),
          _buildFAQItem(
            question: 'ใช้แอปฟรีได้อะไรบ้าง?',
            answer: 'แผนฟรีให้บริการตรวจอาการพื้นฐาน การประเมินเบื้องต้น และสรุปผลการประเมิน โดยจำกัด 3 ครั้งต่อวัน',
          ),
          const Divider(height: 32),
          _buildFAQItem(
            question: 'AI ประเมินอาการแม่นยำแค่ไหน?',
            answer: 'SukAI ใช้ AI เพื่อช่วยประเมินอาการเบื้องต้นเท่านั้น ความแม่นยำขึ้นอยู่กับข้อมูลที่ผู้ใช้ให้มา และไม่สามารถแทนที่การวินิจฉัยจากแพทย์ได้',
          ),
          const Divider(height: 32),
          _buildFAQItem(
            question: 'ถ้าอาการรุนแรงควรทำอย่างไร?',
            answer: 'หากมีอาการรุนแรง แย่ลง หรือไม่แน่ใจ ควรพบแพทย์ทันที หรือโทร 1669 ในกรณีฉุกเฉิน SukAI เป็นเครื่องมือช่วยเบื้องต้นเท่านั้น',
          ),
          const Divider(height: 32),
          _buildFAQItem(
            question: 'สามารถลบข้อมูลได้หรือไม่?',
            answer: 'ได้ค่ะ ผู้ใช้มีสิทธิ์ลบข้อมูลของตนเองออกจากระบบได้ตลอดเวลา โดยสามารถติดต่อทีม SukAI เพื่อขอความช่วยเหลือ',
          ),
          const Divider(height: 32),
          _buildFAQItem(
            question: 'ต้องกรอกข้อมูลสุขภาพหรือไม่?',
            answer: 'ไม่บังคับค่ะ แต่การกรอกข้อมูลสุขภาพจะช่วยให้ AI ประเมินอาการได้แม่นยำขึ้น และปรับคำแนะนำให้เหมาะกับผู้ใช้มากขึ้น',
          ),
        ],
      ),
    );
  }

  Widget _buildFAQItem({required String question, required String answer}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.help_outline, color: AppTheme.textPrimary, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                question,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Padding(
          padding: const EdgeInsets.only(left: 36),
          child: Text(
            answer,
            style: const TextStyle(
              fontSize: 15,
              color: AppTheme.textSecondary,
              height: 1.6,
            ),
          ),
        ),
      ],
    );
  }
}

