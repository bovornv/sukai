import { assessSymptomLogic } from './assess.js';
import { generateDiagnosis } from './diagnosis.js';
import { calculateRiskScore } from './clinical_reasoning.js';
import { supabaseAdmin } from '../../config/supabase.js';
import { recordSessionMetrics } from '../analytics/performance_metrics.js';
import { scheduleFollowupNotifications } from '../../services/notification_scheduler.js';

// In-memory session cache (fallback if DB fails)
const sessions = new Map();

/**
 * Assess symptom and return triage response
 * Follows prompts_clinical_triage_v2.md rules
 * @param {string} language - Language code ('th' or 'en'), defaults to 'th'
 */
export async function assessSymptom({ sessionId, symptom, previousAnswers, userId = null, language = 'th' }) {
  console.log(`[ASSESS-SYMPTOM] Starting assessment: sessionId=${sessionId}, userId=${userId}, symptom="${symptom}"`);
  
  // Try to load from database first
  let session = null;
  try {
    const { data, error } = await supabaseAdmin
      .from('triage_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!error && data) {
      session = {
        id: data.id,
        sessionId: data.session_id,
        symptoms: data.symptoms || [],
        answers: data.answers || {},
        questionsAsked: data.questions_asked || [],
        questionCount: data.question_count || 0,
        triageLevel: data.triage_level,
        createdAt: new Date(data.created_at),
      };
    }
  } catch (err) {
    console.warn('Failed to load session from DB, using cache:', err.message);
  }

  // Fallback to in-memory cache if DB fails
  if (!session) {
    session = sessions.get(sessionId);
  }

  // Create new session if doesn't exist
  if (!session) {
    session = {
      id: null,
      sessionId,
      symptoms: [],
      answers: {},
      questionsAsked: [],
      questionCount: 0,
      triageLevel: null,
      createdAt: new Date(),
    };
  }

  // Determine if this is an answer to a question or a new symptom
  // CRITICAL: If questionCount is 0 AND questionsAsked is empty, this MUST be a new symptom (first message)
  // If previousAnswers has new keys and we already have symptoms, it's likely an answer
  const hasNewAnswers = Object.keys(previousAnswers).some(
    key => !session.answers[key]
  );
  
  // CRITICAL: Check if this is truly the first question
  const isFirstQuestion = session.questionCount === 0 && session.questionsAsked.length === 0;
  const isAnswer = !isFirstQuestion && session.questionCount > 0 && hasNewAnswers && session.symptoms.length > 0;
  
  // Only add as symptom if it's not an answer
  if (!isAnswer) {
    session.symptoms.push(symptom);
  }
  
  // Merge answers
  Object.assign(session.answers, previousAnswers);

  // Use the last actual symptom (not the answer) for triage logic
  // CRITICAL: For symptom-specific questions, use the CURRENT symptom when it's the first question
  // This ensures new symptoms get symptom-specific questions
  const symptomForTriage = isFirstQuestion && symptom
    ? symptom  // Use current symptom if this is the first question
    : (session.symptoms.length > 0 
        ? session.symptoms[session.symptoms.length - 1] 
        : symptom);
  
  // CRITICAL DEBUG: Log all relevant info
  console.log(`[ASSESS] sessionId: ${sessionId}`);
  console.log(`[ASSESS] symptom: "${symptom}", symptomForTriage: "${symptomForTriage}"`);
  console.log(`[ASSESS] questionCount: ${session.questionCount}, questionsAsked.length: ${session.questionsAsked.length}`);
  console.log(`[ASSESS] isFirstQuestion: ${isFirstQuestion}, isAnswer: ${isAnswer}`);
  console.log(`[ASSESS] symptoms array: [${session.symptoms.join(', ')}]`);
  
  // DEBUG: Log symptom detection (remove in production)
  // console.log(`[DEBUG] assessSymptom - symptom: "${symptom}", symptomForTriage: "${symptomForTriage}", isAnswer: ${isAnswer}, questionCount: ${session.questionCount}`);

  // Fetch health profile if userId is available
  let healthProfile = null;
  if (userId && userId !== 'anonymous') {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('gender, birth_date, weight_kg, height_cm, chronic_diseases, drug_allergies, is_pregnant, is_breastfeeding, surgery_history, current_medications, occasional_medications, supplements, food_allergies, other_allergies')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        // Calculate age from birth_date
        let age = null;
        if (data.birth_date) {
          const birthDate = new Date(data.birth_date);
          const now = new Date();
          age = now.getFullYear() - birthDate.getFullYear();
          const monthDiff = now.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        healthProfile = {
          gender: data.gender,
          age,
          weightKg: data.weight_kg,
          heightCm: data.height_cm,
          chronicDiseases: data.chronic_diseases || [],
          drugAllergies: data.drug_allergies || [],
          isPregnant: data.is_pregnant ?? null,
          isBreastfeeding: data.is_breastfeeding ?? null,
          surgeryHistory: data.surgery_history || [],
          currentMedications: data.current_medications || [],
          occasionalMedications: data.occasional_medications || [],
          supplements: data.supplements || [],
          foodAllergies: data.food_allergies || [],
          otherAllergies: data.other_allergies || [],
        };
      }
    } catch (err) {
      console.warn('[PROFILE-LOAD] Failed to load health profile:', err.message);
      // Continue without health profile
    }
  }

  // Merge health profile into answers for clinical reasoning
  const enrichedAnswers = { ...session.answers };
  if (healthProfile) {
    if (healthProfile.age !== null) {
      enrichedAnswers.age = healthProfile.age;
      // Set risk group based on age
      if (healthProfile.age < 2) {
        enrichedAnswers.risk_group = 'เด็ก (< 2 ปี)';
      } else if (healthProfile.age > 65) {
        enrichedAnswers.risk_group = 'ผู้สูงอายุ (> 65 ปี)';
      }
    }
    if (healthProfile.gender) {
      enrichedAnswers.gender = healthProfile.gender;
    }
    // Always set chronic diseases (even if empty array) for hasMandatoryHealthData check
    if (Array.isArray(healthProfile.chronicDiseases)) {
      enrichedAnswers.chronic_diseases = healthProfile.chronicDiseases;
      if (healthProfile.chronicDiseases.length > 0) {
        enrichedAnswers.chronic_disease = healthProfile.chronicDiseases.join(', ');
        enrichedAnswers.risk_group = 'โรคประจำตัว';
      } else {
        enrichedAnswers.chronic_disease = 'ไม่มี';
      }
    }
    // MEDICAL-GRADE: Set all allergies (drug, food, other)
    const allAllergies = [
      ...(healthProfile.drugAllergies || []),
      ...(healthProfile.foodAllergies || []),
      ...(healthProfile.otherAllergies || []),
    ];
    if (allAllergies.length > 0) {
      enrichedAnswers.all_allergies = allAllergies;
      enrichedAnswers.allergy = allAllergies.join(', ');
    } else {
      enrichedAnswers.allergy = 'ไม่มี';
    }
    if (Array.isArray(healthProfile.drugAllergies)) {
      enrichedAnswers.drug_allergies = healthProfile.drugAllergies;
    }
    if (Array.isArray(healthProfile.foodAllergies)) {
      enrichedAnswers.food_allergies = healthProfile.foodAllergies;
    }
    if (Array.isArray(healthProfile.otherAllergies)) {
      enrichedAnswers.other_allergies = healthProfile.otherAllergies;
    }
    
    // Medications
    const allMedications = [
      ...(healthProfile.currentMedications || []),
      ...(healthProfile.occasionalMedications || []),
      ...(healthProfile.supplements || []),
    ];
    if (allMedications.length > 0) {
      enrichedAnswers.current_medications = allMedications;
      enrichedAnswers.medications = allMedications.join(', ');
    }
    
    // Special conditions
    if (healthProfile.isPregnant === true) {
      enrichedAnswers.pregnancy = true;
      enrichedAnswers.pregnant = true;
    }
    if (healthProfile.isBreastfeeding === true) {
      enrichedAnswers.breastfeeding = true;
    }
    
    // Surgery history
    if (Array.isArray(healthProfile.surgeryHistory) && healthProfile.surgeryHistory.length > 0) {
      enrichedAnswers.surgery_history = healthProfile.surgeryHistory;
    }
  }

  // CRITICAL DEBUG: Log before calling assessSymptomLogic
  console.log(`[ASSESS-SYMPTOM] sessionId: ${sessionId}, symptom: "${symptom}", symptomForTriage: "${symptomForTriage}"`);
  console.log(`[ASSESS-SYMPTOM] questionCount: ${session.questionCount}, questionsAsked.length: ${session.questionsAsked.length}`);
  console.log(`[ASSESS-SYMPTOM] isAnswer: ${isAnswer}, symptoms.length: ${session.symptoms.length}`);
  
  // CRITICAL: Store original symptom in answers for body-part clarification
  // When questionCount > 0, 'symptom' parameter is the answer, not the original symptom
  if (session.symptoms.length > 0) {
    enrichedAnswers.original_symptom = session.symptoms[session.symptoms.length - 1];
    enrichedAnswers.symptom = session.symptoms[session.symptoms.length - 1]; // Also store as symptom
  }
  
  // Run triage logic (with Thai language normalization and health profile)
  // CRITICAL: Pass health profile for red flag threshold adjustment (age, chronic diseases)
  const result = await assessSymptomLogic({
    symptom: symptomForTriage,
    previousAnswers: enrichedAnswers,
    questionsAsked: session.questionsAsked,
    questionCount: session.questionCount,
    healthProfile, // Pass health profile for red flag threshold adjustment
    sessionId: sessionId, // Pass sessionId for variation engine
    language, // Pass language for bilingual support
  });
  
  // CRITICAL: Store red flag detection info in session for diagnosis generation
  if (result.redFlagDetected) {
    session.answers.redFlagDetected = result.redFlagDetected;
    session.answers.redFlagScreeningPassed = result.redFlagScreeningPassed || false;
  }
  
  // CRITICAL: Store health_context answer if detected (e.g., "ไม่มี")
  // This ensures the system remembers the user's answer and doesn't ask again
  if (result.healthContextAnswer) {
    session.answers.health_context = result.healthContextAnswer;
    console.log(`[SESSION] Stored health_context answer: "${result.healthContextAnswer}"`);
  }
  
  // MEDICAL-GRADE: Store hypotheses, trajectory, and time-course in session
  if (result.hypotheses) {
    session.answers.hypotheses = result.hypotheses;
    console.log(`[SESSION] Stored ${result.hypotheses.length} hypotheses`);
  }
  if (result.severityTrajectory) {
    session.answers.severity_trajectory = result.severityTrajectory;
  }
  if (result.timeCourse) {
    session.answers.time_course = result.timeCourse;
  }
  
  // DEBUG: Log result
  console.log(`[ASSESS-SYMPTOM] Result - nextQuestion: "${result.nextQuestion?.substring(0, 60)}...", triageLevel: ${result.triageLevel}`);

  // Update session
  if (result.nextQuestion) {
    session.questionsAsked.push(result.nextQuestion);
    session.questionCount++;
  }
  session.triageLevel = result.triageLevel;
  
  // Store confidence score from result if available (for metrics tracking)
  if (result.confidence !== undefined && result.confidence !== null) {
    session.answers.confidence_score = result.confidence;
  }

  // Save to database
  try {
    // Always set user_id if provided (even when updating)
    // This ensures sessions created anonymously get linked to user when they log in
    const finalUserId = userId && userId !== 'anonymous' ? userId : null;
    
    const sessionData = {
      session_id: sessionId,
      user_id: finalUserId,
      symptoms: session.symptoms,
      answers: session.answers,
      questions_asked: session.questionsAsked,
      question_count: session.questionCount,
      triage_level: result.triageLevel,
      updated_at: new Date().toISOString(),
    };

    if (session.id) {
      // Update existing session
      // Always update user_id in case user logged in during session
      const { error: updateError } = await supabaseAdmin
        .from('triage_sessions')
        .update(sessionData)
        .eq('id', session.id);

      if (updateError) {
        console.error('Failed to update session:', updateError);
        throw updateError;
      }
    } else {
      // Insert new session
      const { data, error } = await supabaseAdmin
        .from('triage_sessions')
        .insert({
          ...sessionData,
          created_at: new Date().toISOString(), // Explicitly set created_at
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to insert session:', error);
        throw error;
      }

      if (data) {
        session.id = data.id;
      }
    }
  } catch (err) {
    console.warn('Failed to save session to DB, using cache:', err.message);
    // Fallback to in-memory cache
    sessions.set(sessionId, session);
  }

  // Record performance metrics when session completes (no more questions)
  if (!result.needMoreInfo && !result.nextQuestion) {
    const finalConfidence = session.answers.confidence || session.answers.confidence_score || null;
    await recordSessionMetrics({
      sessionId,
      questionCount: session.questionCount,
      triageLevel: result.triageLevel,
      confidence: finalConfidence,
      userId,
      completedAt: new Date(),
    }).catch(err => {
      // Don't fail the request if metrics recording fails
      console.warn('[ASSESS-SYMPTOM] Failed to record metrics:', err.message);
    });
  }

  return {
    need_more_info: result.needMoreInfo,
    next_question: result.nextQuestion || null,
    triage_level: result.triageLevel,
    // Master Prompt: Include structured question data (choices, step, stepName, allowMultiSelect)
    structured_question: result.structuredQuestion ? {
      question: result.structuredQuestion.question,
      choices: result.structuredQuestion.choices,
      step: result.structuredQuestion.step,
      step_name: result.structuredQuestion.stepName,
      allow_multi_select: result.structuredQuestion.allowMultiSelect || false,
    } : null,
  };
}

/**
 * Get final diagnosis with recommendations
 * @param {string} language - Language code ('th' or 'en'), defaults to 'th'
 */
export async function getDiagnosis({ sessionId, userId = null, language = 'th' }) {
  // Try to load from database first
  let session = null;
  let sessionData = null;
  try {
    const { data, error } = await supabaseAdmin
      .from('triage_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!error && data) {
      sessionData = data;
      session = {
        symptoms: data.symptoms || [],
        answers: data.answers || {},
        triageLevel: data.triage_level,
      };
    } else if (error) {
      console.error('Error loading session from DB:', error);
      // Fallback to cache
      session = sessions.get(sessionId);
    }
  } catch (err) {
    console.warn('Failed to load session from DB, trying cache:', err.message);
    // Fallback to cache
    session = sessions.get(sessionId);
  }

  if (!session) {
    console.error('Session not found for sessionId:', sessionId);
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Ensure session has user_id set (in case user logged in during triage)
  const finalUserId = userId && userId !== 'anonymous' ? userId : null;
  if (finalUserId && sessionData && (!sessionData.user_id || sessionData.user_id !== finalUserId)) {
    try {
      await supabaseAdmin
        .from('triage_sessions')
        .update({ 
          user_id: finalUserId,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
      console.log('Updated session user_id for session:', sessionId);
    } catch (err) {
      console.warn('Failed to update session user_id:', err.message);
    }
  }

  // Fetch health profile if userId is available
  let healthProfile = null;
  if (userId && userId !== 'anonymous') {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('gender, birth_date, weight_kg, height_cm, chronic_diseases, drug_allergies, is_pregnant, is_breastfeeding, surgery_history, current_medications, occasional_medications, supplements, food_allergies, other_allergies')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        // Calculate age from birth_date
        let age = null;
        if (data.birth_date) {
          const birthDate = new Date(data.birth_date);
          const now = new Date();
          age = now.getFullYear() - birthDate.getFullYear();
          const monthDiff = now.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        healthProfile = {
          gender: data.gender,
          age,
          weightKg: data.weight_kg,
          heightCm: data.height_cm,
          chronicDiseases: data.chronic_diseases || [],
          drugAllergies: data.drug_allergies || [],
          isPregnant: data.is_pregnant ?? null,
          isBreastfeeding: data.is_breastfeeding ?? null,
          surgeryHistory: data.surgery_history || [],
          currentMedications: data.current_medications || [],
          occasionalMedications: data.occasional_medications || [],
          supplements: data.supplements || [],
          foodAllergies: data.food_allergies || [],
          otherAllergies: data.other_allergies || [],
        };
      }
    } catch (err) {
      console.warn('[PROFILE-LOAD] Failed to load health profile:', err.message);
      // Continue without health profile
    }
  }

  // Merge health profile into answers for clinical reasoning
  const enrichedAnswers = { ...session.answers };
  if (healthProfile) {
    if (healthProfile.age !== null) {
      enrichedAnswers.age = healthProfile.age;
      // Set risk group based on age
      if (healthProfile.age < 2) {
        enrichedAnswers.risk_group = 'เด็ก (< 2 ปี)';
      } else if (healthProfile.age > 65) {
        enrichedAnswers.risk_group = 'ผู้สูงอายุ (> 65 ปี)';
      }
    }
    if (healthProfile.gender) {
      enrichedAnswers.gender = healthProfile.gender;
    }
    // Always set chronic diseases (even if empty array) for hasMandatoryHealthData check
    if (Array.isArray(healthProfile.chronicDiseases)) {
      enrichedAnswers.chronic_diseases = healthProfile.chronicDiseases;
      if (healthProfile.chronicDiseases.length > 0) {
        enrichedAnswers.chronic_disease = healthProfile.chronicDiseases.join(', ');
        enrichedAnswers.risk_group = 'โรคประจำตัว';
      } else {
        enrichedAnswers.chronic_disease = 'ไม่มี';
      }
    }
    // MEDICAL-GRADE: Set all allergies (drug, food, other)
    const allAllergies = [
      ...(healthProfile.drugAllergies || []),
      ...(healthProfile.foodAllergies || []),
      ...(healthProfile.otherAllergies || []),
    ];
    if (allAllergies.length > 0) {
      enrichedAnswers.all_allergies = allAllergies;
      enrichedAnswers.allergy = allAllergies.join(', ');
    } else {
      enrichedAnswers.allergy = 'ไม่มี';
    }
    if (Array.isArray(healthProfile.drugAllergies)) {
      enrichedAnswers.drug_allergies = healthProfile.drugAllergies;
    }
    if (Array.isArray(healthProfile.foodAllergies)) {
      enrichedAnswers.food_allergies = healthProfile.foodAllergies;
    }
    if (Array.isArray(healthProfile.otherAllergies)) {
      enrichedAnswers.other_allergies = healthProfile.otherAllergies;
    }
    
    // Medications
    const allMedications = [
      ...(healthProfile.currentMedications || []),
      ...(healthProfile.occasionalMedications || []),
      ...(healthProfile.supplements || []),
    ];
    if (allMedications.length > 0) {
      enrichedAnswers.current_medications = allMedications;
      enrichedAnswers.medications = allMedications.join(', ');
    }
    
    // Special conditions
    if (healthProfile.isPregnant === true) {
      enrichedAnswers.pregnancy = true;
      enrichedAnswers.pregnant = true;
    }
    if (healthProfile.isBreastfeeding === true) {
      enrichedAnswers.breastfeeding = true;
    }
    
    // Surgery history
    if (Array.isArray(healthProfile.surgeryHistory) && healthProfile.surgeryHistory.length > 0) {
      enrichedAnswers.surgery_history = healthProfile.surgeryHistory;
    }
  }

  // Calculate risk score for explainable recommendations
  const symptomText = Array.isArray(session.symptoms) 
    ? session.symptoms.join(' ') 
    : (session.symptoms || '');
  const riskScore = calculateRiskScore(symptomText, enrichedAnswers);
  
  // CRITICAL: Pass red flag detection info to diagnosis generation
  // This ensures emergency diagnosis explains which red flag was detected
  const diagnosis = await generateDiagnosis({
    symptoms: session.symptoms,
    answers: enrichedAnswers, // Contains redFlagDetected and redFlagScreeningPassed
    triageLevel: session.triageLevel || 'self_care',
    riskScore,
    healthProfile, // Pass health profile for medication recommendations and red flag threshold adjustment
    language, // Pass language for bilingual output
  });

  // Record performance metrics when diagnosis is generated (session fully complete)
  // Get confidence from session answers or use riskScore as fallback
  const finalConfidence = session.answers?.confidence_score || riskScore || null;
  await recordSessionMetrics({
    sessionId,
    questionCount: session.questionCount || 0,
    triageLevel: session.triageLevel || 'uncertain',
    confidence: finalConfidence,
    userId,
    completedAt: new Date(),
  }).catch(err => {
    // Don't fail the request if metrics recording fails
    console.warn('[GET-DIAGNOSIS] Failed to record metrics:', err.message);
  });

  // Save diagnosis to database
  try {
    const diagnosisData = {
      session_id: sessionId,
      user_id: finalUserId,
      triage_level: diagnosis.triage_level,
      summary: diagnosis.summary,
      // Ensure recommendations is properly serialized (Supabase handles JSONB automatically)
      recommendations: diagnosis.recommendations || null,
    };

    console.log(`[SAVE-DIAGNOSIS] Saving diagnosis for session ${sessionId}:`, {
      session_id: sessionId,
      user_id: finalUserId,
      triage_level: diagnosis.triage_level,
      has_summary: !!diagnosis.summary,
      has_recommendations: !!diagnosis.recommendations,
    });

    const { data, error } = await supabaseAdmin
      .from('diagnoses')
      .insert(diagnosisData)
      .select()
      .single();

    if (error) {
      console.error('[SAVE-DIAGNOSIS] ❌ Failed to save diagnosis:', error);
      console.error('[SAVE-DIAGNOSIS] Error details:', JSON.stringify(error, null, 2));
      console.error('[SAVE-DIAGNOSIS] Diagnosis data:', JSON.stringify(diagnosisData, null, 2));
      throw error;
    }

    console.log(`[SAVE-DIAGNOSIS] ✅ Successfully saved diagnosis with id: ${data?.id}`);
  } catch (err) {
    console.error('[SAVE-DIAGNOSIS] ❌ CRITICAL: Failed to save diagnosis to DB:', err.message);
    console.error('[SAVE-DIAGNOSIS] Stack trace:', err.stack);
    // Continue even if DB save fails (don't break the API response)
  }

  // Schedule follow-up notifications (24h and 48h)
  // Only schedule if user is authenticated and not emergency (emergency cases need immediate care)
  if (finalUserId && diagnosis.triage_level !== 'emergency') {
    try {
      const symptomText = Array.isArray(session.symptoms) && session.symptoms.length > 0
        ? session.symptoms[0] // Use first symptom for notification
        : 'อาการของคุณ';
      
      const hasRedFlags = session.answers?.redFlagDetected === true || 
                         session.answers?.redFlagScreeningPassed === false;
      
      await scheduleFollowupNotifications(
        sessionId,
        finalUserId,
        symptomText,
        hasRedFlags
      );
      
      console.log(`✅ Scheduled follow-up notifications for session ${sessionId}`);
    } catch (err) {
      // Don't fail the request if notification scheduling fails
      console.warn('[GET-DIAGNOSIS] Failed to schedule notifications:', err.message);
    }
  }

  return diagnosis;
}
