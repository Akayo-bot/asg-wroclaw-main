import React, { useEffect, useRef } from 'react';

const SparkleEffect: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.offsetWidth;
                canvas.height = parent.offsetHeight;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle class
        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
            fadeSpeed: number;
            color: string;

            constructor(canvas: HTMLCanvasElement) {
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + 10;
                this.size = Math.random() * 2 + 1.5;
                this.speedX = (Math.random() - 0.5) * 0.8;
                this.speedY = -(Math.random() * 1.5 + 0.8);
                this.opacity = Math.random() * 0.6 + 0.4;
                this.fadeSpeed = Math.random() * 0.008 + 0.003;

                // Green neon colors (brighter)
                const colors = ['#00ff88', '#00ff99', '#33ffaa', '#66ffbb'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.opacity -= this.fadeSpeed;
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.save();
                ctx.globalAlpha = this.opacity;

                // Stronger glow effect
                ctx.shadowBlur = 20;
                ctx.shadowColor = this.color;

                // Draw particle
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // Additional glow layer
                ctx.shadowBlur = 30;
                ctx.globalAlpha = this.opacity * 0.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            isDead() {
                return this.opacity <= 0 || this.y < -10;
            }
        }

        // Animation
        let particles: Particle[] = [];
        let animationFrameId: number;
        let lastSpawnTime = 0;

        const animate = (currentTime: number) => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Spawn new particles
            if (currentTime - lastSpawnTime > 150) {
                if (particles.length < 50) {
                    particles.push(new Particle(canvas));
                    lastSpawnTime = currentTime;
                }
            }

            // Update and draw particles
            particles = particles.filter(particle => {
                particle.update();
                particle.draw(ctx);
                return !particle.isDead();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
            }}
        />
    );
};

export default SparkleEffect;

