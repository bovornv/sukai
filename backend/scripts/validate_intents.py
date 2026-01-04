#!/usr/bin/env python3
"""
Validate symptom intents dataset
Checks for required fields, duplicates, and data quality
"""

import json
import sys
from pathlib import Path
from collections import Counter

def validate_intents(filepath):
    """Validate intents JSON file"""
    print(f"🔍 Validating {filepath}...\n")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    intents = data.get('intents', [])
    print(f"📊 Total intents: {len(intents)}\n")
    
    errors = []
    warnings = []
    
    # Required fields
    required_fields = [
        'intent_id', 'primary_symptom', 'display_text_th', 'display_text_en',
        'body_system', 'severity_level', 'time_course',
        'red_flag_question_th', 'red_flag_question_en',
        'red_flag_if_yes', 'emergency_level', 'confidence_weight',
        'status'
    ]
    
    # Check each intent
    intent_ids = []
    primary_symptoms = []
    
    for i, intent in enumerate(intents):
        intent_id = intent.get('intent_id', f'intent_{i+1}')
        
        # Check required fields (handle both nested and flat structures)
        # Check intent_id
        if 'intent_id' not in intent:
            errors.append(f"Intent {i+1}: Missing required field 'intent_id'")
        
        # Check display text (nested or flat)
        has_display_nested = 'display' in intent and isinstance(intent['display'], dict)
        has_display_flat = 'display_text_th' in intent and 'display_text_en' in intent
        if not has_display_nested and not has_display_flat:
            errors.append(f"Intent {intent_id}: Missing display text (need 'display' or 'display_text_th/en')")
        
        # Check primary symptom
        if 'primary_symptom' not in intent:
            errors.append(f"Intent {intent_id}: Missing required field 'primary_symptom'")
        
        # Check body system
        if 'body_system' not in intent:
            errors.append(f"Intent {intent_id}: Missing required field 'body_system'")
        
        # Check severity/time_course (nested or flat)
        has_clinical_nested = 'clinical_context' in intent and isinstance(intent['clinical_context'], dict)
        has_clinical_flat = 'severity_level' in intent and 'time_course' in intent
        if not has_clinical_nested and not has_clinical_flat:
            errors.append(f"Intent {intent_id}: Missing severity/time_course (need 'clinical_context' or 'severity_level/time_course')")
        
        # Check red flag (nested or flat)
        has_redflag_nested = 'red_flag' in intent and isinstance(intent['red_flag'], dict)
        has_redflag_flat = 'red_flag_question_th' in intent and 'red_flag_question_en' in intent
        if not has_redflag_nested and not has_redflag_flat:
            errors.append(f"Intent {intent_id}: Missing red flag question (need 'red_flag' or 'red_flag_question_th/en')")
        
        # Check status
        has_status_nested = 'metadata' in intent and 'status' in intent.get('metadata', {})
        has_status_flat = 'status' in intent
        if not has_status_nested and not has_status_flat:
            errors.append(f"Intent {intent_id}: Missing 'status' field")
        
        # Check intent_id uniqueness
        intent_id = intent.get('intent_id')
        if intent_id:
            if intent_id in intent_ids:
                errors.append(f"Duplicate intent_id: {intent_id}")
            intent_ids.append(intent_id)
        
        # Check primary symptom
        primary_symptom = intent.get('primary_symptom')
        if primary_symptom:
            primary_symptoms.append(primary_symptom)
        
        # Check confidence weight range
        weight = intent.get('confidence_weight')
        if weight is not None:
            if weight < 0.02 or weight > 0.15:
                warnings.append(f"Intent {intent_id}: confidence_weight {weight} outside recommended range (0.02-0.15)")
        
        # Check emergency logic consistency
        red_flag = intent.get('red_flag_if_yes', False)
        emergency_level = intent.get('emergency_level', 'none')
        if red_flag and emergency_level == 'none':
            warnings.append(f"Intent {intent_id}: red_flag_if_yes=True but emergency_level='none'")
        
        # Check display text not empty (handle both nested and flat)
        display_th = None
        display_en = None
        
        if 'display' in intent and isinstance(intent['display'], dict):
            display_th = intent['display'].get('th') or ''
            display_en = intent['display'].get('en') or ''
        else:
            display_th = intent.get('display_text_th') or ''
            display_en = intent.get('display_text_en') or ''
        
        # Only check if both are truly empty (allow empty strings if they're valid)
        if display_th is None or display_en is None:
            errors.append(f"Intent {intent_id}: Missing display text fields")
        elif not display_th.strip() or not display_en.strip():
            # Allow empty strings but warn if they're just whitespace
            if display_th.strip() or display_en.strip():
                warnings.append(f"Intent {intent_id}: Display text contains only whitespace")
            else:
                errors.append(f"Intent {intent_id}: Empty display text")
    
    # Print summary
    print("📈 Statistics:")
    print(f"  Unique intent_ids: {len(set(intent_ids))}")
    print(f"  Primary symptoms: {len(set(primary_symptoms))}")
    
    symptom_counts = Counter(primary_symptoms)
    print(f"\n📋 Intents per primary symptom:")
    for symptom, count in sorted(symptom_counts.items(), key=lambda x: -x[1]):
        print(f"  {symptom}: {count}")
    
    # Print errors and warnings
    if errors:
        print(f"\n❌ Errors ({len(errors)}):")
        for error in errors[:10]:  # Show first 10
            print(f"  {error}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors")
    
    if warnings:
        print(f"\n⚠️  Warnings ({len(warnings)}):")
        for warning in warnings[:10]:  # Show first 10
            print(f"  {warning}")
        if len(warnings) > 10:
            print(f"  ... and {len(warnings) - 10} more warnings")
    
    if not errors and not warnings:
        print("\n✅ All validations passed!")
        return 0
    elif not errors:
        print("\n⚠️  Validation passed with warnings")
        return 0
    else:
        print("\n❌ Validation failed")
        return 1

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python validate_intents.py <intents_file.json>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    if not Path(filepath).exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)
    
    exit_code = validate_intents(filepath)
    sys.exit(exit_code)
