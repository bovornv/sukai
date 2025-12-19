import { assessSymptomLogic } from './assess.js';
import { generateDiagnosis } from './diagnosis.js';
import { calculateRiskScore } from './clinical_reasoning.js';
import { supabaseAdmin } from '../../config/supabase.js';

// In-memory session cache (fallback if DB fails)
const sessions = new Map();

/**
 * Assess symptom and return triage response
 * Follows prompts_clinical_triage_v2.md rules
 */
export async function assessSymptom({ sessionId, symptom, previousAnswers, userId = null }) {
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
  // If previousAnswers has new keys and we already have symptoms, it's likely an answer
  const hasNewAnswers = Object.keys(previousAnswers).some(
    key => !session.answers[key]
  );
  const isAnswer = hasNewAnswers && session.symptoms.length > 0;
  
  // Only add as symptom if it's not an answer
  if (!isAnswer) {
    session.symptoms.push(symptom);
  }
  
  // Merge answers
  Object.assign(session.answers, previousAnswers);

  // Use the last actual symptom (not the answer) for triage logic
  const symptomForTriage = session.symptoms.length > 0 
    ? session.symptoms[session.symptoms.length - 1] 
    : symptom;

  // Fetch health profile if userId is available
  let healthProfile = null;
  if (userId && userId !== 'anonymous') {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('gender, birth_date, weight_kg, height_cm, chronic_diseases, drug_allergies')
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
        };
      }
    } catch (err) {
      console.warn('Failed to load health profile:', err.message);
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
    if (healthProfile.chronicDiseases && healthProfile.chronicDiseases.length > 0) {
      enrichedAnswers.chronic_disease = healthProfile.chronicDiseases.join(', ');
      enrichedAnswers.risk_group = 'โรคประจำตัว';
    }
    if (healthProfile.drugAllergies && healthProfile.drugAllergies.length > 0) {
      enrichedAnswers.allergy = healthProfile.drugAllergies.join(', ');
    }
  }

  // Run triage logic (with Thai language normalization and health profile)
  const result = await assessSymptomLogic({
    symptom: symptomForTriage,
    previousAnswers: enrichedAnswers,
    questionsAsked: session.questionsAsked,
    questionCount: session.questionCount,
    healthProfile, // Pass health profile for clinical reasoning
  });

  // Update session
  if (result.nextQuestion) {
    session.questionsAsked.push(result.nextQuestion);
    session.questionCount++;
  }
  session.triageLevel = result.triageLevel;

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

  return {
    need_more_info: result.needMoreInfo,
    next_question: result.nextQuestion || null,
    triage_level: result.triageLevel,
  };
}

/**
 * Get final diagnosis with recommendations
 */
export async function getDiagnosis({ sessionId, userId = null }) {
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
        .select('gender, birth_date, weight_kg, height_cm, chronic_diseases, drug_allergies')
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
        };
      }
    } catch (err) {
      console.warn('Failed to load health profile:', err.message);
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
    if (healthProfile.chronicDiseases && healthProfile.chronicDiseases.length > 0) {
      enrichedAnswers.chronic_disease = healthProfile.chronicDiseases.join(', ');
      enrichedAnswers.risk_group = 'โรคประจำตัว';
    }
    if (healthProfile.drugAllergies && healthProfile.drugAllergies.length > 0) {
      enrichedAnswers.allergy = healthProfile.drugAllergies.join(', ');
    }
  }

  // Calculate risk score for explainable recommendations
  const symptomText = Array.isArray(session.symptoms) 
    ? session.symptoms.join(' ') 
    : (session.symptoms || '');
  const riskScore = calculateRiskScore(symptomText, enrichedAnswers);
  
  const diagnosis = await generateDiagnosis({
    symptoms: session.symptoms,
    answers: enrichedAnswers,
    triageLevel: session.triageLevel || 'self_care',
    riskScore,
    healthProfile, // Pass health profile for medication recommendations
  });

  // Save diagnosis to database
  try {
    const diagnosisData = {
      session_id: sessionId,
      user_id: finalUserId,
      triage_level: diagnosis.triage_level,
      summary: diagnosis.summary,
      recommendations: diagnosis.recommendations,
    };

    await supabaseAdmin
      .from('diagnoses')
      .insert(diagnosisData);
  } catch (err) {
    console.warn('Failed to save diagnosis to DB:', err.message);
    // Continue even if DB save fails
  }

  return diagnosis;
}
