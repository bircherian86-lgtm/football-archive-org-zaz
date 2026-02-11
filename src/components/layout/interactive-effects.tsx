'use client';

import { useEffect, useRef } from 'react';

const CLICK_SOUND_URL = 'https://files.catbox.moe/dcce1j.mp3';

export function InteractiveEffects() {
    const clickSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio on the client
        clickSoundRef.current = new Audio(CLICK_SOUND_URL);
        clickSoundRef.current.volume = 0.4;

        const playClickSound = (event: MouseEvent) => {
            if ((event.target as HTMLElement).closest('[data-interactive="true"]')) {
                if (clickSoundRef.current) {
                    clickSoundRef.current.currentTime = 0;
                    clickSoundRef.current.play().catch(e => { /* Ignore play errors */ });
                }
            }
        };

        document.addEventListener('click', playClickSound);

        return () => {
            document.removeEventListener('click', playClickSound);
        };
    }, []);

    return null;
}
