#!/usr/bin/env python3
"""
Intent Expansion Script (Python version)
Expands symptom_intents_master.json with more intents following the schema

Usage:
    python scripts/expand_intents.py --add-symptom "ปวดหัว" --count 10
    python scripts/expand_intents.py --expand-all
"""

import json
import sys
import argparse
from pathlib import Path

# Primary symptoms by body system
PRIMARY_SYMPTOMS = {
    'neurology': ['ปวดหัว', 'เวียนหัว', 'หน้ามืด', 'เป็นลม'],
    'respiratory': ['ไอ', 'หายใจลำบาก', 'หายใจหอบ', 'หายใจไม่อิ่ม'],
    'cardiology': ['เจ็บหน้าอก', 'ใจสั่น'],
    'gastrointestinal': ['ปวดท้อง', 'ท้องเสีย', 'ท้องผูก', 'คลื่นไส้', 'อาเจียน'],
    'ent_oral': ['เจ็บคอ', 'ปวดฟัน', 'หูอื้อ', 'ปวดหู', 'น้ำมูกไหล', 'คัดจมูก'],
    'musculoskeletal': ['ปวดหลัง', 'ปวดคอ', 'ปวดบ่า', 'ปวดข้อ', 'ปวดเมื่อย'],
    'general_infection': ['ไข้', 'อ่อนเพลีย', 'ผื่น', 'บวม', 'หน้าบวม', 'ตาแดง', 'คัน'],
    'neurological': ['เดินเซ', 'ชา', 'ชัก'],
    'other': ['เลือดออก', 'แผล', 'น้ำร้อนลวก', 'แผลไหม้', 'นอนไม่หลับ', 'ปวดตา'],
}

# Display text templates
# Expanded display templates for all primary symptoms
DISPLAY_TEMPLATES = {
    'ปวดหัว': {
        'th': [
            'ปวดหัวข้างเดียว', 'ปวดหัวสองข้าง', 'ปวดหัวรุนแรงทันที',
            'ปวดหัวมากขึ้นเรื่อย ๆ', 'ปวดหัวทุกวัน', 'ปวดหัวมา ๆ หาย ๆ',
            'ปวดหัวตอนเช้า', 'ปวดหัวหลังอดนอน', 'ปวดหัวหลังดื่มแอลกอฮอล์',
            'ปวดหัวร่วมกับอาเจียน', 'ปวดหัวร่วมกับตาพร่า', 'ปวดหัวร่วมกับคอแข็ง',
            'ปวดหัวร่วมกับไข้', 'ปวดหัวหลังบาดเจ็บ', 'ปวดหัวร้าวไปคอ',
        ],
        'en': [
            'One-sided headache', 'Bilateral headache', 'Sudden severe headache',
            'Worsening headache', 'Daily headache', 'Recurrent headache',
            'Morning headache', 'Sleep-deprived headache', 'Alcohol-induced headache',
            'Headache with vomiting', 'Headache with blurred vision', 'Headache with neck stiffness',
            'Headache with fever', 'Post-traumatic headache', 'Headache radiating to neck',
        ],
    },
    'ไอ': {
        'th': [
            'ไอแห้ง', 'ไอมีเสมหะ', 'ไอมีเสมหะสีเหลือง', 'ไอมีเสมหะสีเขียว',
            'ไอเป็นเลือด', 'ไอตอนกลางคืน', 'ไอเรื้อรังเกิน 2 สัปดาห์',
            'ไอมากกว่า 1 สัปดาห์', 'ไอร่วมกับเจ็บหน้าอก', 'ไอร่วมกับเจ็บคอ',
            'ไอร่วมกับหายใจหอบ', 'ไอร่วมกับไข้', 'ไอหลังนอน', 'ไอรุนแรง',
        ],
        'en': [
            'Dry cough', 'Cough with phlegm', 'Cough with yellow phlegm', 'Cough with green phlegm',
            'Coughing blood', 'Nighttime cough', 'Chronic cough over 2 weeks',
            'Cough over 1 week', 'Cough with chest pain', 'Cough with sore throat',
            'Cough with shortness of breath', 'Cough with fever', 'Cough after lying down', 'Severe cough',
        ],
    },
    'เจ็บหน้าอก': {
        'th': [
            'เจ็บหน้าอกแน่น', 'เจ็บหน้าอกเหมือนถูกกด', 'เจ็บหน้าอกแปล๊บ',
            'เจ็บหน้าอกร้าวแขนซ้าย', 'เจ็บหน้าอกร้าวกราม', 'เจ็บหน้าอกร่วมกับเหงื่อออก',
            'เจ็บหน้าอกขณะพัก', 'เจ็บหน้าอกขณะออกแรง', 'เจ็บหน้าอกร่วมกับหายใจลำบาก',
            'เจ็บหน้าอกรุนแรงทันที', 'เจ็บหน้าอกหลังออกกำลัง', 'เจ็บหน้าอกเป็น ๆ หาย ๆ',
        ],
        'en': [
            'Tight chest pain', 'Chest pain like pressure', 'Sharp chest pain',
            'Chest pain radiating to left arm', 'Chest pain radiating to jaw', 'Chest pain with sweating',
            'Chest pain at rest', 'Chest pain on exertion', 'Chest pain with difficulty breathing',
            'Sudden severe chest pain', 'Chest pain after exercise', 'Recurrent chest pain',
        ],
    },
    'ปวดท้อง': {
        'th': [
            'ปวดท้องบิด', 'ปวดท้องรุนแรง', 'ปวดท้องขวาล่าง', 'ปวดท้องซ้ายบน',
            'ปวดท้องบนลิ้นปี่', 'ปวดท้องหลังอาหาร', 'ปวดท้องร่วมกับไข้',
            'ปวดท้องร่วมกับอาเจียน', 'ปวดท้องด้านบน', 'ปวดท้องด้านล่าง',
            'ปวดท้องด้านขวา', 'ปวดท้องด้านซ้าย', 'ปวดท้องเป็น ๆ หาย ๆ',
        ],
        'en': [
            'Cramping abdominal pain', 'Severe abdominal pain', 'Lower right abdominal pain', 'Upper left abdominal pain',
            'Epigastric pain', 'Abdominal pain after eating', 'Abdominal pain with fever',
            'Abdominal pain with vomiting', 'Upper abdominal pain', 'Lower abdominal pain',
            'Right side abdominal pain', 'Left side abdominal pain', 'Recurrent abdominal pain',
        ],
    },
    'เวียนหัว': {
        'th': [
            'เวียนหัวหมุน', 'เวียนหัวเหมือนจะเป็นลม', 'เวียนหัวตอนลุกยืน',
            'เวียนหัวร่วมกับคลื่นไส้', 'เวียนหัวร่วมกับหูอื้อ', 'เวียนหัวเป็นนาที',
            'เวียนหัวเป็นชั่วโมง', 'เวียนหัวเมื่อเปลี่ยนท่า', 'เวียนหัวรุนแรง',
            'เวียนหัวเป็น ๆ หาย ๆ', 'เวียนหัวหลังบาดเจ็บ', 'เวียนหัวร่วมกับอ่อนแรง',
        ],
        'en': [
            'Spinning dizziness', 'Dizziness like fainting', 'Dizziness when standing',
            'Dizziness with nausea', 'Dizziness with ear ringing', 'Dizziness lasting minutes',
            'Dizziness lasting hours', 'Dizziness when changing position', 'Severe dizziness',
            'Recurrent dizziness', 'Dizziness after injury', 'Dizziness with weakness',
        ],
    },
    'หายใจลำบาก': {
        'th': [
            'หายใจไม่อิ่ม', 'หายใจเร็วผิดปกติ', 'หายใจลำบากขณะพัก',
            'หายใจลำบากหลังออกแรง', 'หายใจลำบากร่วมกับแน่นหน้าอก', 'หายใจลำบากร่วมกับเจ็บหน้าอก',
            'หายใจหอบ', 'หายใจลำบากหลังออกกำลัง', 'หายใจลำบากรุนแรง',
            'หายใจลำบากร่วมกับไอ', 'หายใจลำบากตอนกลางคืน', 'หายใจลำบากเป็น ๆ หาย ๆ',
        ],
        'en': [
            'Shortness of breath', 'Abnormally fast breathing', 'Difficulty breathing at rest',
            'Difficulty breathing after exertion', 'Difficulty breathing with chest tightness', 'Difficulty breathing with chest pain',
            'Wheezing', 'Difficulty breathing after exercise', 'Severe difficulty breathing',
            'Difficulty breathing with cough', 'Difficulty breathing at night', 'Recurrent difficulty breathing',
        ],
    },
    'ไข้': {
        'th': [
            'ไข้สูง', 'ไข้ต่ำหลายวัน', 'ไข้ร่วมกับหนาวสั่น', 'ไข้ร่วมกับผื่น',
            'ไข้ในเด็ก', 'ไข้เป็น ๆ หาย ๆ', 'ไข้หลังเดินทาง',
            'ไข้ร่วมกับปวดหัว', 'ไข้ร่วมกับไอ', 'ไข้ร่วมกับปวดเมื่อย',
            'ไข้เรื้อรัง', 'ไข้สูงมาก',
        ],
        'en': [
            'High fever', 'Low-grade fever for days', 'Fever with chills', 'Fever with rash',
            'Fever in children', 'Recurrent fever', 'Fever after travel',
            'Fever with headache', 'Fever with cough', 'Fever with body aches',
            'Chronic fever', 'Very high fever',
        ],
    },
    'ท้องเสีย': {
        'th': [
            'ท้องเสียหลายครั้งต่อวัน', 'ท้องเสียเป็นน้ำ', 'ท้องเสียมีมูกเลือด',
            'ท้องเสียร่วมกับไข้', 'ท้องเสียหลังทานอาหาร', 'ท้องเสียรุนแรง',
            'ท้องเสียเป็น ๆ หาย ๆ', 'ท้องเสียร่วมกับปวดท้อง', 'ท้องเสียเรื้อรัง',
            'ท้องเสียหลังดื่มน้ำ', 'ท้องเสียร่วมกับอาเจียน', 'ท้องเสียมากกว่า 3 วัน',
        ],
        'en': [
            'Diarrhea multiple times per day', 'Watery diarrhea', 'Diarrhea with mucus/blood',
            'Diarrhea with fever', 'Diarrhea after eating', 'Severe diarrhea',
            'Recurrent diarrhea', 'Diarrhea with abdominal pain', 'Chronic diarrhea',
            'Diarrhea after drinking water', 'Diarrhea with vomiting', 'Diarrhea over 3 days',
        ],
    },
    'คลื่นไส้': {
        'th': [
            'คลื่นไส้ร่วมกับอาเจียน', 'คลื่นไส้หลังทานอาหาร', 'คลื่นไส้ร่วมกับปวดท้อง',
            'คลื่นไส้เป็น ๆ หาย ๆ', 'คลื่นไส้ร่วมกับเวียนหัว', 'คลื่นไส้รุนแรง',
            'คลื่นไส้ตอนเช้า', 'คลื่นไส้เรื้อรัง', 'คลื่นไส้ร่วมกับไข้',
            'คลื่นไส้หลังดื่มแอลกอฮอล์', 'คลื่นไส้ทุกวัน', 'คลื่นไส้หลังทานยา',
        ],
        'en': [
            'Nausea with vomiting', 'Nausea after eating', 'Nausea with abdominal pain',
            'Recurrent nausea', 'Nausea with dizziness', 'Severe nausea',
            'Morning nausea', 'Chronic nausea', 'Nausea with fever',
            'Nausea after alcohol', 'Daily nausea', 'Nausea after medication',
        ],
    },
    'อาเจียน': {
        'th': [
            'อาเจียนรุนแรง', 'อาเจียนเป็นเลือด', 'อาเจียนร่วมกับปวดหัว',
            'อาเจียนหลังอาหาร', 'อาเจียนหลายครั้ง', 'อาเจียนร่วมกับไข้',
            'อาเจียนเรื้อรัง', 'อาเจียนร่วมกับปวดท้อง', 'อาเจียนเป็น ๆ หาย ๆ',
            'อาเจียนทุกวัน', 'อาเจียนหลังดื่มแอลกอฮอล์', 'อาเจียนไม่หยุด',
        ],
        'en': [
            'Severe vomiting', 'Vomiting blood', 'Vomiting with headache',
            'Vomiting after eating', 'Multiple episodes of vomiting', 'Vomiting with fever',
            'Chronic vomiting', 'Vomiting with abdominal pain', 'Recurrent vomiting',
            'Daily vomiting', 'Vomiting after alcohol', 'Persistent vomiting',
        ],
    },
    'เจ็บคอ': {
        'th': [
            'เจ็บคอมาก', 'เจ็บคอข้างเดียว', 'เจ็บคอร่วมกับไข้',
            'เจ็บคอร่วมกับเสียงแหบ', 'เจ็บคอร่วมกับไอ', 'เจ็บคอกลืนลำบาก',
            'เจ็บคอเป็น ๆ หาย ๆ', 'เจ็บคอเรื้อรัง', 'เจ็บคอร่วมกับน้ำมูกไหล',
            'เจ็บคอหลังตื่นนอน', 'เจ็บคอร่วมกับต่อมน้ำเหลืองบวม', 'เจ็บคอทุกวัน',
        ],
        'en': [
            'Severe sore throat', 'One-sided sore throat', 'Sore throat with fever',
            'Sore throat with hoarseness', 'Sore throat with cough', 'Difficulty swallowing',
            'Recurrent sore throat', 'Chronic sore throat', 'Sore throat with runny nose',
            'Sore throat after waking', 'Sore throat with swollen lymph nodes', 'Daily sore throat',
        ],
    },
    'ปวดฟัน': {
        'th': [
            'ปวดฟันตุบ', 'ปวดฟันเวลากัด', 'ปวดฟันร่วมกับเหงือกบวม',
            'ปวดฟันร่วมกับไข้', 'ปวดฟันรุนแรง', 'ปวดฟันเป็น ๆ หาย ๆ',
            'ปวดฟันเรื้อรัง', 'ปวดฟันหลังทานของหวาน', 'ปวดฟันร่วมกับบวม',
            'ปวดฟันทุกวัน', 'ปวดฟันหลังทำฟัน', 'ปวดฟันรุนแรงทันที',
        ],
        'en': [
            'Throbbing toothache', 'Toothache when biting', 'Toothache with swollen gums',
            'Toothache with fever', 'Severe toothache', 'Recurrent toothache',
            'Chronic toothache', 'Toothache after sweets', 'Toothache with swelling',
            'Daily toothache', 'Toothache after dental work', 'Sudden severe toothache',
        ],
    },
    'ปวดหลัง': {
        'th': [
            'ปวดหลังรุนแรง', 'ปวดหลังส่วนล่าง', 'ปวดหลังร้าวลงขา',
            'ปวดหลังหลังยกของ', 'ปวดหลังเรื้อรัง', 'ปวดหลังส่วนบน',
            'ปวดหลังร่วมกับขาอ่อนแรง', 'ปวดหลังร่วมกับชา', 'ปวดหลังกลั้นปัสสาวะไม่ได้',
            'ปวดหลังรุนแรงทันที', 'ปวดหลังเป็น ๆ หาย ๆ', 'ปวดหลังทุกวัน',
        ],
        'en': [
            'Severe back pain', 'Lower back pain', 'Back pain radiating to leg',
            'Back pain after lifting', 'Chronic back pain', 'Upper back pain',
            'Back pain with leg weakness', 'Back pain with numbness', 'Back pain with urinary incontinence',
            'Sudden severe back pain', 'Recurrent back pain', 'Daily back pain',
        ],
    },
    'ปวดคอ': {
        'th': [
            'ปวดคอตึง', 'ปวดคอขยับไม่ได้', 'ปวดคอร่วมกับไข้',
            'ปวดคอรุนแรง', 'ปวดคอหลังนอน', 'ปวดคอเรื้อรัง',
            'ปวดคอเป็น ๆ หาย ๆ', 'ปวดคอหลังบาดเจ็บ', 'ปวดคอร่วมกับปวดหัว',
            'ปวดคอทุกวัน', 'ปวดคอหลังทำงาน', 'ปวดคอรุนแรงทันที',
        ],
        'en': [
            'Stiff neck pain', 'Neck pain unable to move', 'Neck pain with fever',
            'Severe neck pain', 'Neck pain after sleeping', 'Chronic neck pain',
            'Recurrent neck pain', 'Neck pain after injury', 'Neck pain with headache',
            'Daily neck pain', 'Neck pain after work', 'Sudden severe neck pain',
        ],
    },
    'ใจสั่น': {
        'th': [
            'ใจสั่นเป็นพัก ๆ', 'ใจสั่นต่อเนื่อง', 'ใจสั่นร่วมกับหน้ามืด',
            'ใจสั่นหลังดื่มกาแฟ', 'ใจสั่นตอนกลางคืน', 'ใจสั่นตอนพัก',
            'ใจสั่นรุนแรง', 'ใจสั่นนานหลายชั่วโมง', 'ใจสั่นเป็น ๆ หาย ๆ',
            'ใจสั่นทุกวัน', 'ใจสั่นหลังออกกำลัง', 'ใจสั่นร่วมกับเจ็บหน้าอก',
        ],
        'en': [
            'Intermittent palpitations', 'Continuous palpitations', 'Palpitations with dizziness',
            'Palpitations after coffee', 'Palpitations at night', 'Palpitations at rest',
            'Severe palpitations', 'Palpitations lasting hours', 'Recurrent palpitations',
            'Daily palpitations', 'Palpitations after exercise', 'Palpitations with chest pain',
        ],
    },
    'หน้ามืด': {
        'th': [
            'หน้ามืดเวลาลุก', 'หน้ามืดเป็นวูบ', 'หน้ามืดร่วมกับใจสั่น',
            'หน้ามืดร่วมกับเหงื่อออก', 'หน้ามืดเหมือนจะเป็นลม', 'หน้ามืดรุนแรง',
            'หน้ามืดเป็น ๆ หาย ๆ', 'หน้ามืดหลังออกกำลัง', 'หน้ามืดทุกวัน',
            'หน้ามืดหลังทานยา', 'หน้ามืดร่วมกับอ่อนแรง', 'หน้ามืดหลังบาดเจ็บ',
        ],
        'en': [
            'Dizziness when standing', 'Sudden dizziness', 'Dizziness with palpitations',
            'Dizziness with sweating', 'Dizziness like fainting', 'Severe dizziness',
            'Recurrent dizziness', 'Dizziness after exercise', 'Daily dizziness',
            'Dizziness after medication', 'Dizziness with weakness', 'Dizziness after injury',
        ],
    },
    'เป็นลม': {
        'th': [
            'เป็นลมหมดสติ', 'เป็นลมเป็นครั้งแรก', 'เป็นลมหลายครั้ง',
            'เป็นลมหลังลุกยืน', 'เป็นลมร่วมกับใจสั่น', 'เป็นลมหลังออกกำลัง',
            'เป็นลมหลังบาดเจ็บ', 'เป็นลมร่วมกับไข้', 'เป็นลมรุนแรง',
            'เป็นลมเป็น ๆ หาย ๆ', 'เป็นลมทุกวัน', 'เป็นลมหลังทานยา',
        ],
        'en': [
            'Fainting with loss of consciousness', 'First-time fainting', 'Multiple episodes of fainting',
            'Fainting after standing', 'Fainting with palpitations', 'Fainting after exercise',
            'Fainting after injury', 'Fainting with fever', 'Severe fainting',
            'Recurrent fainting', 'Daily fainting', 'Fainting after medication',
        ],
    },
    'ผื่น': {
        'th': [
            'ผื่นคัน', 'ผื่นร่วมกับไข้', 'ผื่นแดง', 'ผื่นเป็น ๆ หาย ๆ',
            'ผื่นหลังทานยา', 'ผื่นขึ้นทั่วตัว', 'ผื่นเรื้อรัง',
            'ผื่นร่วมกับบวม', 'ผื่นหลังสัมผัสสาร', 'ผื่นทุกวัน',
            'ผื่นรุนแรง', 'ผื่นร่วมกับปวด',
        ],
        'en': [
            'Itchy rash', 'Rash with fever', 'Red rash', 'Recurrent rash',
            'Rash after medication', 'Rash all over body', 'Chronic rash',
            'Rash with swelling', 'Rash after contact', 'Daily rash',
            'Severe rash', 'Rash with pain',
        ],
    },
    'อ่อนเพลีย': {
        'th': [
            'อ่อนเพลียมาก', 'อ่อนเพลียเรื้อรัง', 'อ่อนเพลียร่วมกับน้ำหนักลด',
            'อ่อนเพลียทุกวัน', 'อ่อนเพลียหลังป่วย', 'อ่อนเพลียร่วมกับไข้',
            'อ่อนเพลียหลังออกกำลัง', 'อ่อนเพลียเรื้อรังหลายเดือน', 'อ่อนเพลียร่วมกับนอนไม่หลับ',
            'อ่อนเพลียรุนแรง', 'อ่อนเพลียเป็น ๆ หาย ๆ', 'อ่อนเพลียทุกวัน',
        ],
        'en': [
            'Severe fatigue', 'Chronic fatigue', 'Fatigue with weight loss',
            'Daily fatigue', 'Fatigue after illness', 'Fatigue with fever',
            'Fatigue after exercise', 'Chronic fatigue for months', 'Fatigue with insomnia',
            'Severe fatigue', 'Recurrent fatigue', 'Daily fatigue',
        ],
    },
}

# Red flag questions
RED_FLAG_QUESTIONS = {
    'ปวดหัว': {
        'th': 'ปวดหัวรุนแรงที่สุดในชีวิตหรือเกิดขึ้นทันทีไหมคะ?',
        'en': 'Is this the worst headache of your life or sudden onset?',
    },
    'ไอ': {
        'th': 'ไอเป็นเลือดหรือหายใจลำบากมากไหมคะ?',
        'en': 'Are you coughing blood or having severe breathing difficulty?',
    },
    'เจ็บหน้าอก': {
        'th': 'เจ็บหน้าอกรุนแรงทันทีหรือร้าวไปแขนซ้ายไหมคะ?',
        'en': 'Is the chest pain sudden and severe or radiating to left arm?',
    },
    'หายใจลำบาก': {
        'th': 'หายใจลำบากมากหรือมีอาการเขียวคล้ำไหมคะ?',
        'en': 'Is breathing severely difficult or are you turning blue?',
    },
    'ปวดท้อง': {
        'th': 'ปวดท้องรุนแรงมากหรือมีไข้สูงร่วมด้วยไหมคะ?',
        'en': 'Is the abdominal pain severe or accompanied by high fever?',
    },
}

def get_body_system(primary_symptom):
    """Get body system for a primary symptom"""
    for system, symptoms in PRIMARY_SYMPTOMS.items():
        if primary_symptom in symptoms:
            return system
    return 'general'

def generate_intent_id(primary_symptom, index):
    """Generate intent ID"""
    prefix_map = {
        'ปวดหัว': 'HEADACHE',
        'เวียนหัว': 'DIZZINESS',
        'หน้ามืด': 'FAINTNESS',
        'เป็นลม': 'SYNCOPE',
        'ไอ': 'COUGH',
        'หายใจลำบาก': 'DYSPNEA',
        'เจ็บหน้าอก': 'CHEST_PAIN',
        'ใจสั่น': 'PALPITATION',
        'ปวดท้อง': 'ABDOMINAL_PAIN',
        'ท้องเสีย': 'DIARRHEA',
        'คลื่นไส้': 'NAUSEA',
        'อาเจียน': 'VOMITING',
        'เจ็บคอ': 'SORE_THROAT',
        'ปวดฟัน': 'TOOTHACHE',
        'ปวดหลัง': 'BACK_PAIN',
        'ไข้': 'FEVER',
    }
    prefix = prefix_map.get(primary_symptom, primary_symptom.upper().replace(' ', '_'))
    return f'{prefix}_{index:03d}'

def determine_emergency(display_text_th):
    """Determine if intent is emergency based on keywords"""
    emergency_keywords = ['รุนแรงทันที', 'รุนแรงมาก', 'เป็นเลือด', 'หมดสติ', 'หายใจลำบากมาก']
    return any(keyword in display_text_th for keyword in emergency_keywords)

def generate_intent(primary_symptom, index, display_th, display_en):
    """Generate a single intent"""
    intent_id = generate_intent_id(primary_symptom, index)
    body_system = get_body_system(primary_symptom)
    
    # Determine severity and time course from display text
    severity = 'severe' if 'รุนแรง' in display_th else ('mild' if 'เล็กน้อย' in display_th else 'moderate')
    time_course = 'chronic' if 'เรื้อรัง' in display_th or 'ทุกวัน' in display_th else ('progressive' if 'มากขึ้น' in display_th else 'acute')
    
    # Emergency check
    is_emergency = determine_emergency(display_th)
    emergency_level = 'immediate' if is_emergency else ('urgent' if severity == 'severe' else 'none')
    triage_if_no = None if is_emergency else ('self_care' if severity == 'mild' else 'gp')
    
    # Confidence weight
    confidence_weight = 0.15 if is_emergency else (0.08 if severity == 'severe' else 0.05)
    
    # Red flag question
    red_flag_q = RED_FLAG_QUESTIONS.get(primary_symptom, {
        'th': 'มีอาการรุนแรงหรือฉุกเฉินไหมคะ?',
        'en': 'Are there severe or emergency symptoms?',
    })
    
    # OTC and self-care
    otc_group = ['analgesic_basic'] if severity == 'mild' and not is_emergency else []
    self_care_group = ['rest_hydration']
    
    return {
        'intent_id': intent_id,
        'primary_symptom': primary_symptom,
        'display_text_th': display_th,
        'display_text_en': display_en,
        'body_system': body_system,
        'severity_level': severity,
        'time_course': time_course,
        'location': None,
        'trigger': None,
        'associated_symptoms': '',
        'red_flag_question_th': red_flag_q['th'],
        'red_flag_question_en': red_flag_q['en'],
        'red_flag_if_yes': is_emergency,
        'emergency_level': emergency_level,
        'triage_if_no': triage_if_no,
        'confidence_weight': round(confidence_weight, 3),
        'otc_group': ','.join(otc_group),
        'self_care_group': ','.join(self_care_group),
        'contraindications': '',
        'age_min': 18,
        'age_max': 99,
        'requires_health_profile': is_emergency or severity == 'severe',
        'notes_medical': f'Generated intent for {primary_symptom}',
        'status': 'active',
    }

def expand_intents_for_symptom(primary_symptom, count=12):
    """Generate intents for a primary symptom"""
    intents = []
    templates = DISPLAY_TEMPLATES.get(primary_symptom, {
        'th': [primary_symptom] * count,
        'en': [primary_symptom] * count,
    })
    
    th_templates = templates['th']
    en_templates = templates['en']
    
    for i in range(min(count, len(th_templates))):
        display_th = th_templates[i] if i < len(th_templates) else f'{primary_symptom} {i+1}'
        display_en = en_templates[i] if i < len(en_templates) else f'{primary_symptom} {i+1}'
        intents.append(generate_intent(primary_symptom, i + 1, display_th, display_en))
    
    return intents

def main():
    parser = argparse.ArgumentParser(description='Expand symptom intents dataset')
    parser.add_argument('--add-symptom', help='Primary symptom to add (e.g., "ปวดหัว")')
    parser.add_argument('--count', type=int, default=12, help='Number of intents to generate')
    parser.add_argument('--expand-all', action='store_true', help='Expand all primary symptoms')
    parser.add_argument('--output', default='../data/symptom_intents_expanded.json', help='Output file path')
    
    args = parser.parse_args()
    
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / 'data'
    
    # Resolve output path relative to data_dir
    if args.output.startswith('../'):
        output_path = script_dir / args.output
    else:
        output_path = data_dir / args.output
    
    # Load existing intents
    existing_file = data_dir / 'symptom_intents_master.json'
    if existing_file.exists():
        with open(existing_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            existing_intents = data.get('intents', [])
    else:
        existing_intents = []
        data = {'version': '1.0', 'language': ['th', 'en'], 'intents': []}
    
    existing_ids = {intent.get('intent_id') for intent in existing_intents}
    
    if args.expand_all:
        # Generate for all primary symptoms
        new_intents = []
        for system, symptoms in PRIMARY_SYMPTOMS.items():
            for symptom in symptoms:
                intents = expand_intents_for_symptom(symptom, 10)
                for intent in intents:
                    if intent['intent_id'] not in existing_ids:
                        new_intents.append(intent)
                        existing_ids.add(intent['intent_id'])
        
        print(f'Generated {len(new_intents)} new intents')
        data['intents'].extend(new_intents)
        
    elif args.add_symptom:
        intents = expand_intents_for_symptom(args.add_symptom, args.count)
        new_intents = [i for i in intents if i['intent_id'] not in existing_ids]
        print(f'Generated {len(new_intents)} new intents for {args.add_symptom}')
        data['intents'].extend(new_intents)
    else:
        parser.print_help()
        return
    
    # Write updated JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f'Written {len(data["intents"])} total intents to {output_path}')

if __name__ == '__main__':
    main()
