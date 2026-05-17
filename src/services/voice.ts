
import axios from 'axios';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // A natural sounding voice (Bella)

const DB_NAME = 'VoiceCacheDB';
const STORE_NAME = 'audio_cache';

async function getDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCachedAudio(text: string): Promise<Blob | null> {
  const db = await getDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(text);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

async function cacheAudio(text: string, blob: Blob) {
  const db = await getDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.put(blob, text);
}

export async function speak(text: string) {
  if (!text) return;

  try {
    // Check cache first
    let audioBlob = await getCachedAudio(text);

    if (!audioBlob) {
      if (!ELEVENLABS_API_KEY) {
        console.warn('ElevenLabs API key not found');
        return;
      }

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'blob',
        }
      );

      audioBlob = response.data;
      if (audioBlob) {
        await cacheAudio(text, audioBlob);
      }
    }

    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
    }
  } catch (error) {
    console.error('Error in ElevenLabs TTS:', error);
  }
}
