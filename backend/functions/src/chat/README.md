# Chat Function

Backend function for AI doctor chat.

## API Endpoints

### POST /chat/message
Send chat message to AI doctor.

**Request:**
```json
{
  "session_id": "uuid",
  "message": "user message",
  "history": []
}
```

**Response:**
```json
{
  "id": "message_id",
  "text": "doctor response",
  "is_from_user": false,
  "timestamp": "ISO8601"
}
```

## Rules
- Warm, friendly tone
- Short sentences
- No medical jargon
- Follow prompts_doctor_chat_v2.md
