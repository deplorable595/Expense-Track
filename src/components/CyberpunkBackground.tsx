import { useRef, useEffect } from 'react';

export const CyberpunkBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        // Grid parameters
        const gridSize = 40;
        let offset = 0;
        const speed = 0.5;

        const resize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);

        const drawGrid = () => {
            // Theme Config (Enforced Dark Mode)
            const colors = {
                bgTop: '#020202',
                bgMid: '#050505',
                bgBot: '#0a0a0a',
                line: '0, 212, 255' // Cyan
            };

            // Clear with a gradient background
            const gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, colors.bgTop);
            gradient.addColorStop(0.5, colors.bgMid);
            gradient.addColorStop(1, colors.bgBot);

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // --- Retro Grid Floor ---
            // We'll simulate a 3D floor by changing line spacing and opacity

            const horizonY = h * 0.4; // Horizon line position
            const bottomY = h;

            ctx.save();
            ctx.beginPath();
            // Clip everything above the horizon? Or just fade it out. 
            // Let's draw the floor below the horizon.

            // Vertical lines (converging to a vanishing point)
            // The vanishing point is at (w/2, horizonY)
            const centerX = w / 2;

            ctx.strokeStyle = `rgba(${colors.line}, 0.2)`;
            ctx.lineWidth = 1;

            // Draw vertical lines
            // We scan from left to right on the bottom, and draw to the vanishing point
            // But let's just draw lines radiating from center for simpler effect
            // Actually, standard perspective grid:
            // Vertical lines are straight in 1-point perspective if they are parallel to Z axis?
            // No, vertical lines (along Z) converge to vanishing point.
            // Horizontal lines (along X) remain horizontal but get closer together.

            // Radiating lines (Z-axis lines)
            const numVLines = 40;
            for (let i = -numVLines; i <= numVLines; i++) {
                const x = centerX + (i * 100); // Spacing at bottom

                ctx.beginPath();
                ctx.moveTo(centerX, horizonY);
                ctx.lineTo(x, bottomY);
                ctx.stroke();
            }

            // Horizontal lines (X-axis lines, moving towards camera)
            // Spacing grows exponentially as we get closer
            // We animate 'offset' to make them move

            offset = (offset + speed) % gridSize;

            // Draw horizontal lines from horizon to bottom
            // We use a perspective transform helper or just geometric progression
            // Geometric progression: y = horizonY + (distance / z)

            // Simple approximation
            for (let z = 0; z < h; z += gridSize) {
                // This is a naive flat grid. We need perspective.
                // Let's use a simple quadratic curve or just exponential spacing?
                // Let's stick to a simpler "retro wave" style grid: 
                // top half is sky/stars, bottom half is grid
            }

            // Better Grid rendering loop
            const floorHeight = bottomY - horizonY;

            // Horizontal lines moving down
            // We map a 'gridZ' coordinate to screen Y
            // Z goes from near (large) to far (small)
            // or from 0 (horizon) to 1 (bottom)

            for (let i = 0; i < 40; i++) {
                // Virtual Z coordinate from 0 to 1, moving
                // We add offset to i to animate
                const z = (i + (offset / gridSize)) / 20;
                // Exponential mapping for perspective: y ~ 1/z is wrong, standard is y = 1/z
                // Let's use a power function to bunch lines near horizon

                if (z <= 0) continue;

                // Normalized Y position (0 = horizon, 1 = bottom)
                const yNorm = Math.pow(z, 2); // Squared gives nice perspective bunching? 

                // Actually, standard perspective projection: y_screen = y_world / z_world
                // For a floor plane y=-H, points at Z map to -H/Z.
                // Since Z goes to infinity at horizon, 1/Z -> 0.

                // Let's use a simpler heuristic that looks good
                // Line Y position
                const lineY = horizonY + (yNorm * floorHeight);

                if (lineY > h) continue;

                // Opacity fades near horizon
                const alpha = Math.min(1, yNorm * 2) * 0.3;
                ctx.strokeStyle = `rgba(${colors.line}, ${alpha})`;

                ctx.beginPath();
                ctx.moveTo(0, lineY);
                ctx.lineTo(w, lineY);
                ctx.stroke();
            }

            ctx.restore();

            // --- Particles / Stars in Background ---
            // Moving slowly

            // --- Digital Rain / Code Glitch (Optional) ---
            // Let's keep it clean: Grid + Glow

            requestAnimationFrame(drawGrid);
        };

        const animId = requestAnimationFrame(drawGrid);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 -z-10 h-full w-full bg-background"
        />
    );
};
