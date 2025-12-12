class ChatMessage {
  final String id;
  final String text;
  final bool isFromUser;
  final DateTime timestamp;

  const ChatMessage({
    required this.id,
    required this.text,
    required this.isFromUser,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      text: json['text'] as String,
      isFromUser: json['is_from_user'] as bool? ?? json['isFromUser'] as bool,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'is_from_user': isFromUser,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
