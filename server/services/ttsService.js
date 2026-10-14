/**
 * services/ttsService.js — High-Fidelity Neural Text-to-Speech Engine
 * 
 * Powered by Microsoft Edge Neural TTS:
 * - Natural human cadence (100% non-robotic)
 * - Energetic Indian mentor voice (hi-IN-MadhurNeural)
 * - Dynamic +22% speaking rate to eliminate sluggishness
 * - Instant in-memory / temp audio synthesis for WhatsApp PTT
 * 
 * CareerPath AI Technologies Inc.
 */

const { EdgeTTS } = require('node-edge-tts');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_VOICE = process.env.WHATSAPP_TTS_VOICE || 'hi-IN-MadhurNeural';
const DEFAULT_RATE = process.env.WHATSAPP_TTS_RATE || '+22%'; // Crisp, energetic, fast pacing
const DEFAULT_PITCH = process.env.WHATSAPP_TTS_PITCH || '+2Hz';

/**
 * Prepares text for optimal spoken audio clarity.
 * Strips markdown symbols, links, and excessive punctuation.
 * 
 * @param {string} rawText - Input text (markdown or plain)
 * @param {number} [maxLength=400] - Max character length for spoken voice note
 * @returns {string} - Clean spoken text
 */
function cleanTextForSpeech(rawText, maxLength = 400) {
  if (!rawText || typeof rawText !== 'string') return '';

  let clean = rawText
    // Remove markdown links e.g. [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove markdown symbols
    .replace(/[*#_~`>•\-]/g, ' ')
    // Replace multiple spaces or newlines with a single clean space
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Trim to sensible sentence boundary within maxLength
  if (clean.length > maxLength) {
    const truncated = clean.slice(0, maxLength);
    const lastPeriod = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('!'), truncated.lastIndexOf('?'));
    if (lastPeriod > maxLength * 0.6) {
      clean = truncated.slice(0, lastPeriod + 1);
    } else {
      clean = truncated.trim() + '...';
    }
  }

  return clean;
}

/**
 * Synthesizes high-energy, natural neural audio for WhatsApp voice notes.
 * 
 * @param {string} text - Text to speak
 * @param {object} [options] - Custom voice options
 * @returns {Promise<{base64: string, buffer: Buffer, provider: string}>}
 */
async function generateNeuralVoiceNote(text, options = {}) {
  const spokenText = cleanTextForSpeech(text, options.maxLength || 400);
  if (!spokenText) {
    throw new Error('Empty text provided for speech synthesis');
  }

  const voice = options.voice || DEFAULT_VOICE;
  const rate = options.rate || DEFAULT_RATE;
  const pitch = options.pitch || DEFAULT_PITCH;

  const tempFile = path.join(
    os.tmpdir(),
    `cp_voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.mp3`
  );

  try {
    const tts = new EdgeTTS({
      voice,
      lang: voice.startsWith('hi-') ? 'hi-IN' : 'en-IN',
      rate,
      pitch,
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      timeout: 10000
    });

    await tts.ttsPromise(spokenText, tempFile);
    const buffer = await fs.promises.readFile(tempFile);
    const base64 = `data:audio/mp3;base64,${buffer.toString('base64')}`;

    console.log(`[Neural TTS] Synthesized ${buffer.length} bytes using ${voice} at ${rate} speed`);
    return {
      base64,
      buffer,
      spokenText,
      provider: 'edge_neural_tts'
    };
  } catch (edgeErr) {
    console.warn('[Neural TTS] EdgeTTS synthesis failed, falling back to Google TTS:', edgeErr.message);
    
    // Fallback: Google Translate TTS audio URL
    const shortChunk = spokenText.slice(0, 190);
    const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortChunk)}&tl=hi&client=tw-ob`;
    return {
      url: fallbackUrl,
      spokenText: shortChunk,
      provider: 'google_tts_fallback'
    };
  } finally {
    fs.promises.unlink(tempFile).catch(() => {});
  }
}

module.exports = {
  cleanTextForSpeech,
  generateNeuralVoiceNote
};
