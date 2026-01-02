import { useState, useCallback, useRef } from 'react';

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported] = useState(() =>
        typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const [error, setError] = useState<string | null>(null);

    const startListening = useCallback(() => {
        if (!isSupported) return;
        setError(null);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const instance = new SpeechRecognition();
        instance.continuous = false;
        instance.interimResults = true;
        instance.lang = 'fr-FR';

        instance.onstart = () => setIsListening(true);
        instance.onend = () => setIsListening(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        instance.onerror = (event: any) => {
            if (event.error === 'network') {
                console.warn('Speech recognition network error (requires internet connection).');
            } else if (event.error === 'no-speech') {
                // Ignore no-speech, it's common
            } else {
                console.error('Speech recognition error', event.error);
            }
            setError(event.error);
            setIsListening(false);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        instance.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(currentTranscript);
        };

        recognitionRef.current = instance;
        try {
            instance.start();
        } catch (e) {
            console.error(e);
        }
    }, [isSupported]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return { isListening, transcript, startListening, stopListening, isSupported, error };
};

