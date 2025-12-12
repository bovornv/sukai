/**
 * Chat function
 * Follows prompts_doctor_chat_v2.md and PROBLEM_DRIVEN_IMPLEMENTATION.md strictly
 * Problem 1: Must reduce uncertainty & fear - every response must move toward clear triage
 * Forbidden: vague advice without criteria, "may be multiple things", long explanations
 */

import { supabaseAdmin } from '../../config/supabase.js';

const DIAGNOSIS_REQUEST_RESPONSE = 'หมอขอประเมินระดับความเร่งด่วนก่อนนะคะ';

const ANXIOUS_KEYWORDS = [
  'กังวล',
  'กลัว',
  'เป็นอะไร',
  'รุนแรงไหม',
  'อันตรายไหม',
];

// PROBLEM_DRIVEN_IMPLEMENTATION.md: Must reduce uncertainty, provide clear next action
const REASSURANCE_RESPONSES = [
  'ไม่ต้องกังวลนะคะ หมอจะช่วยประเมินให้ชัดเจน',
  'เข้าใจความกังวลค่ะ ขอถามเพิ่มเติมเพื่อให้คำแนะนำที่ชัดเจน',
  'หมอจะช่วยดูอาการให้ค่ะ เพื่อบอกว่าควรทำอะไรต่อไป',
];

/**
 * Check if user is asking for diagnosis
 */
function isAskingForDiagnosis(message) {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('เป็นอะไร') ||
    lowerMessage.includes('วินิจฉัย') ||
    lowerMessage.includes('โรคอะไร') ||
    lowerMessage.includes('ป่วยเป็น')
  );
}

/**
 * Check if user seems anxious
 */
function isAnxious(message) {
  const lowerMessage = message.toLowerCase();
  return ANXIOUS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Generate appropriate response
 * PROBLEM_DRIVEN_IMPLEMENTATION.md: Must reduce uncertainty, provide clear direction
 * Forbidden: "ลองสังเกตอาการไปก่อน" without criteria, "อาจเป็นได้หลายอย่าง"
 */
function generateResponse(message, history) {
  // Rule: If user asks for diagnosis - redirect to triage (reduces uncertainty)
  if (isAskingForDiagnosis(message)) {
    return DIAGNOSIS_REQUEST_RESPONSE;
  }

  // Rule: If user is anxious - reassure and provide clear next step (reduces fear)
  if (isAnxious(message)) {
    const randomReassurance = REASSURANCE_RESPONSES[
      Math.floor(Math.random() * REASSURANCE_RESPONSES.length)
    ];
    return randomReassurance;
  }

  // Default: Acknowledge and guide toward triage (reduces uncertainty)
  // Short, friendly, one concept per response
  const acknowledgments = [
    'เข้าใจแล้วค่ะ',
    'เข้าใจนะคะ',
    'ขอบคุณที่บอกมา',
  ];

  const followUps = [
    'ขอถามเพิ่มเติมเพื่อประเมินให้ชัดเจนนะคะ',
    'บอกเพิ่มเติมได้เลยนะคะ เพื่อให้คำแนะนำที่ถูกต้อง',
  ];

  const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
  const followUp = followUps[Math.floor(Math.random() * followUps.length)];

  return `${ack} ${followUp}`;
}

/**
 * Send chat message
 */
export async function sendMessage({ sessionId, message, history, userId = null }) {
  const responseText = generateResponse(message, history);
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Save user message to database
  try {
    await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId && userId !== 'anonymous' ? userId : null,
        message: message,
        response: responseText,
        is_from_user: true,
        created_at: timestamp,
      });
  } catch (err) {
    console.warn('Failed to save user message to DB:', err.message);
  }

  // Save bot response to database
  try {
    await supabaseAdmin
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId && userId !== 'anonymous' ? userId : null,
        message: message,
        response: responseText,
        is_from_user: false,
        created_at: timestamp,
      });
  } catch (err) {
    console.warn('Failed to save bot response to DB:', err.message);
  }

  return {
    id: messageId,
    text: responseText,
    is_from_user: false,
    timestamp: timestamp,
  };
}
