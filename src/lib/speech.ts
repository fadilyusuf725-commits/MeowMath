export function speakIndonesian(text: string, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'id-ID'
  utterance.rate = 0.9
  utterance.pitch = 1.08
  const indonesianVoice = window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith('id'))
  if (indonesianVoice) utterance.voice = indonesianVoice
  window.speechSynthesis.speak(utterance)
}
