import { assessSymptomLogic } from './assess.js';
import { generateDiagnosis } from './diagnosis.js';
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

  // Add symptom to session
  session.symptoms.push(symptom);
  Object.assign(session.answers, previousAnswers);

  // Run triage logic
  const result = await assessSymptomLogic({
    symptom,
    previousAnswers: session.answers,
    questionsAsked: session.questionsAsked,
    questionCount: session.questionCount,
  });

  // Update session
  if (result.nextQuestion) {
    session.questionsAsked.push(result.nextQuestion);
    session.questionCount++;
  }
  session.triageLevel = result.triageLevel;

  // Save to database
  try {
    const sessionData = {
      session_id: sessionId,
      user_id: userId && userId !== 'anonymous' ? userId : null,
      symptoms: session.symptoms,
      answers: session.answers,
      questions_asked: session.questionsAsked,
      question_count: session.questionCount,
      triage_level: result.triageLevel,
      updated_at: new Date().toISOString(),
    };

    if (session.id) {
      // Update existing session
      await supabaseAdmin
        .from('triage_sessions')
        .update(sessionData)
        .eq('id', session.id);
    } else {
      // Insert new session
      const { data, error } = await supabaseAdmin
        .from('triage_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (!error && data) {
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
  try {
    const { data, error } = await supabaseAdmin
      .from('triage_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (!error && data) {
      session = {
        symptoms: data.symptoms || [],
        answers: data.answers || {},
        triageLevel: data.triage_level,
      };
    }
  } catch (err) {
    console.warn('Failed to load session from DB, trying cache:', err.message);
    // Fallback to cache
    session = sessions.get(sessionId);
  }

  if (!session) {
    throw new Error('Session not found');
  }

  const diagnosis = await generateDiagnosis({
    symptoms: session.symptoms,
    answers: session.answers,
    triageLevel: session.triageLevel || 'self_care',
  });

  // Save diagnosis to database
  try {
    const diagnosisData = {
      session_id: sessionId,
      user_id: userId && userId !== 'anonymous' ? userId : null,
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
