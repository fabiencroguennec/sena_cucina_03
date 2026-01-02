import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SpeechButtonProps {
    onTranscript: (text: string) => void;
    onStarted?: () => void;
    onStopped?: () => void;
    className?: string;
}

export const SpeechButton = ({ onTranscript, onStarted, onStopped, className }: SpeechButtonProps) => {
    const { isListening, transcript, startListening, stopListening, isSupported, error } = useSpeechRecognition();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (error) {
            if (error === 'network') {
                toast.error("Erreur réseau : Vérifiez votre connexion internet.");
            } else if (error === 'not-allowed') {
                toast.error("Microphone bloqué : Vérifiez vos permissions.");
            } else if (error === 'no-speech') {
                // Ignore no-speech, it happens often
            } else {
                toast.error(`Erreur de dictée : ${error}`);
            }
            onStopped?.();
        }
    }, [error, onStopped]);

    useEffect(() => {
        if (transcript) {
            onTranscript(transcript);
        }
    }, [transcript, onTranscript]);

    if (!mounted || !isSupported) {
        return null;
    }

    const toggleListening = () => {
        if (isListening) {
            stopListening();
            onStopped?.();
        } else {
            onStarted?.();
            startListening();
        }
    };

    return (
        <Button
            type="button"
            variant={isListening ? "default" : "ghost"}
            size="icon"
            className={cn("transition-all duration-200", isListening && "bg-red-500 hover:bg-red-600 text-white animate-pulse", className)}
            onClick={toggleListening}
            title={isListening ? "Arrêter l'enregistrement" : "Dicter l'étape"}
        >
            {isListening ? (
                <MicOff className="h-4 w-4" />
            ) : (
                <Mic className="h-4 w-4" />
            )}
        </Button>
    );
};
