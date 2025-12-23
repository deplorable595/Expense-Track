import { useEffect, useState } from 'react';
import './CyberpunkLoader.css';

interface CyberpunkLoaderProps {
    onComplete?: () => void;
    minLoadTime?: number; // Minimum time to show loader in ms
}

export const CyberpunkLoader: React.FC<CyberpunkLoaderProps> = ({
    onComplete,
    minLoadTime = 4500 // Aligns with the 4s CSS animation + buffer
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        // Simulate complex system initialization
        // In a real app, this would listen to window.onload or specific resource promises
        const startTime = Date.now();

        const handleLoad = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minLoadTime - elapsed);

            setTimeout(() => {
                setIsLoaded(true);
                // Allow the "exit" animation to play (scale up + fade out defined in CSS)
                setTimeout(() => {
                    setShouldRender(false);
                    if (onComplete) onComplete();
                }, 800); // 0.8s transition time matched with CSS
            }, remaining);
        };

        if (document.readyState === 'complete') {
            handleLoad();
        } else {
            window.addEventListener('load', handleLoad);
            // Fallback safety for Single Page Apps where 'load' might have passed
            setTimeout(handleLoad, minLoadTime);
        }

        return () => window.removeEventListener('load', handleLoad);
    }, [minLoadTime, onComplete]);

    if (!shouldRender) return null;

    return (
        <div className={`cp-loader-container ${isLoaded ? 'loaded' : ''}`} aria-hidden={isLoaded}>
            {/* Visual Effects */}
            <div className="cp-scanlines"></div>
            <div className="cp-grid-bg"></div>

            {/* Central Content */}
            <div className="cp-glitch" data-text="SYSTEM_INITIALIZING...">
                SYSTEM_INITIALIZING...
            </div>

            <div className="cp-progress-container">
                <div className="cp-progress-bar"></div>
            </div>

            {/* Floating Data Nodes */}
            <div className="cp-node cp-node-tl">
                REL-X: 44.2<br />
                NET: SECURE
            </div>
            <div className="cp-node cp-node-tr">
                MEM: 64TB<br />
                UP: 99.9%
            </div>
            <div className="cp-node cp-node-bl">
                0x5F3759DF<br />
                NULL_PTR
            </div>
            <div className="cp-node cp-node-br">
                V.2.0.77<br />
                READY
            </div>
        </div>
    );
};
