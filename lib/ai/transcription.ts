/**
 * Call transcription service (stub)
 * TODO: Implement with OpenAI Whisper when ready
 */
export async function generateTranscript(audioUrl: string): Promise<string> {
  // TODO: Implement when Whisper integration ready
  console.log(`[AI STUB] Would transcribe audio from: ${audioUrl}`);

  return `[Transcript will be generated here]

Salesperson: Hi, this is the OpenSmile team calling about your interest in dental treatment.
Lead: Yes, I submitted a form last week.
Salesperson: Great! I wanted to learn more about what you're looking for...

[Continue conversation...]
`;
}
