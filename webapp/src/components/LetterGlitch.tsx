import { useRef, useEffect, ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";


interface LetterGlitchProps {
    glitchColors?: string[];
    glitchSpeed?: number;
    centerVignette?: boolean;
    outerVignette?: boolean;
    smooth?: boolean;
    children?: ReactNode;
}

const LetterGlitch: React.FC<LetterGlitchProps> = ({
    glitchColors = ["#cccccc"],
    glitchSpeed = 50,
    centerVignette = false,
    outerVignette = true,
    smooth = true,
    children,
}) => {
    const isMobile = useIsMobile();

    // Ajustes responsivos
    const fontSize = isMobile ? 12 : 16;
    const charWidth = isMobile ? 8 : 10;
    const charHeight = isMobile ? 16 : 20;
    const effectiveGlitchSpeed = isMobile ? glitchSpeed * 1.5 : glitchSpeed;

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationRef = useRef<number | null>(null);
    const context = useRef<CanvasRenderingContext2D | null>(null);
    const lastGlitchTime = useRef(Date.now());
    const grid = useRef({ columns: 0, rows: 0 });
    const letters = useRef<
        { char: string; color: string; targetColor: string; colorProgress: number }[]
    >([]);

    const symbols = [
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
        "!", "@", "#", "$", "&", "*", "(", ")", "-", "_", "+", "=", "/", "[", "]", "{", "}", ";", ":", "<", ">", ",",
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    ];

    const getRandomChar = () =>
        symbols[Math.floor(Math.random() * symbols.length)];
    const getRandomColor = () =>
        glitchColors[Math.floor(Math.random() * glitchColors.length)];

    const hexToRgb = (hex: string) => {
        const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthand, (_, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            }
            : null;
    };

    const interpolateColor = (
        start: { r: number; g: number; b: number },
        end: { r: number; g: number; b: number },
        t: number
    ) => {
        const r = Math.round(start.r + (end.r - start.r) * t);
        const g = Math.round(start.g + (end.g - start.g) * t);
        const b = Math.round(start.b + (end.b - start.b) * t);
        return `rgb(${r}, ${g}, ${b})`;
    };

    const calculateGrid = (w: number, h: number) => ({
        columns: Math.ceil(w / charWidth),
        rows: Math.ceil(h / charHeight),
    });

    const initLetters = (cols: number, rows: number) => {
        grid.current = { columns: cols, rows };
        letters.current = Array.from({ length: cols * rows }, () => ({
            char: getRandomChar(),
            color: getRandomColor(),
            targetColor: getRandomColor(),
            colorProgress: 1,
        }));
    };

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = parent.getBoundingClientRect();
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        if (context.current) {
            context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        const { columns, rows } = calculateGrid(width, height);
        initLetters(columns, rows);
        draw();
    };

    const draw = () => {
        const ctx = context.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        const { width, height } = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, width, height);
        ctx.font = `${fontSize}px monospace`;
        ctx.textBaseline = "top";

        letters.current.forEach((letter, i) => {
            const x = (i % grid.current.columns) * charWidth;
            const y = Math.floor(i / grid.current.columns) * charHeight;
            ctx.fillStyle = letter.color;
            ctx.fillText(letter.char, x, y);
        });
    };

    const update = () => {
        const count = Math.max(1, Math.floor(letters.current.length * 0.05));
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * letters.current.length);
            const l = letters.current[idx];
            l.char = getRandomChar();
            l.targetColor = getRandomColor();
            l.colorProgress = smooth ? 0 : 1;
            if (!smooth) l.color = l.targetColor;
        }
    };

    const smoothTransition = () => {
        let needRedraw = false;
        letters.current.forEach(l => {
            if (l.colorProgress < 1) {
                l.colorProgress = Math.min(l.colorProgress + 0.05, 1);
                const from = hexToRgb(l.color);
                const to = hexToRgb(l.targetColor);
                if (from && to) {
                    l.color = interpolateColor(from, to, l.colorProgress);
                    needRedraw = true;
                }
            }
        });
        if (needRedraw) draw();
    };

    const animate = () => {
        const now = Date.now();
        if (now - lastGlitchTime.current >= effectiveGlitchSpeed) {
            update();
            draw();
            lastGlitchTime.current = now;
        }
        if (smooth) smoothTransition();
        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        context.current = canvas.getContext("2d");
        resizeCanvas();
        animate();

        const onResize = () => {
            cancelAnimationFrame(animationRef.current!);
            resizeCanvas();
            animate();
        };
        window.addEventListener("resize", onResize);
        return () => {
            cancelAnimationFrame(animationRef.current!);
            window.removeEventListener("resize", onResize);
        };
    }, [smooth, effectiveGlitchSpeed, fontSize, charWidth, charHeight]);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            <canvas ref={canvasRef} className="block w-full h-full" />
            {outerVignette && (
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,_rgba(0,0,0,0)_60%,_rgba(0,0,0,1)_100%)]" />
            )}
            {centerVignette && (
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,_rgba(0,0,0,0.8)_0%,_rgba(0,0,0,0)_60%)]" />
            )}
            {children && (
                <div className="absolute inset-0 flex items-center justify-center px-4">
                    {children}
                </div>
            )}
        </div>
    );
};

export default LetterGlitch;