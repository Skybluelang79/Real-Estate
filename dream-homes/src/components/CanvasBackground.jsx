import { useRef, useEffect } from 'react';

export default function CanvasBackground({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    let sparkles = [];
    let goldDust = [];
    let mouseX = -1000;
    let mouseY = -1000;
    let scrollSpeed = 0;
    let lastScrollY = 0;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    window.addEventListener('scroll', () => {
      const dy = Math.abs(window.scrollY - lastScrollY);
      scrollSpeed = Math.min(dy * 0.02, 2);
      lastScrollY = window.scrollY;
    });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2.5 + 0.5;
        this.opacity = Math.random() * 0.6 + 0.2;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
        this.pulsePhase = Math.random() * Math.PI * 2;
      }
      update() {
        const speedBoost = 1 + scrollSpeed;
        this.vx += (Math.random() - 0.5) * 0.02;
        this.vy += (Math.random() - 0.5) * 0.02;
        this.vx = Math.max(-0.8, Math.min(0.8, this.vx));
        this.vy = Math.max(-0.8, Math.min(0.8, this.vy));
        this.x += this.vx * speedBoost;
        this.y += this.vy * speedBoost;
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.y < -20) this.y = canvas.height + 20;
        if (this.y > canvas.height + 20) this.y = -20;
        this.pulsePhase += this.pulseSpeed;
      }
      draw() {
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 168, 76, ${this.opacity * pulse})`;
        ctx.fill();
      }
    }

    class Sparkle {
      constructor() {
        this.reset(true);
      }
      reset(initial) {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.life = Math.random() * 200 + 100;
        this.maxLife = this.life;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3 - 0.2;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
        if (initial) this.life = Math.random() * this.maxLife;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.rotationSpeed;
        this.life--;
        if (this.life <= 0) this.reset(false);
      }
      draw() {
        const progress = this.life / this.maxLife;
        const alpha = progress < 0.3 ? progress / 0.3 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const s = this.size;
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.5);
        ctx.lineTo(s * 0.4, -s * 0.3);
        ctx.lineTo(s * 1.5, 0);
        ctx.lineTo(s * 0.4, s * 0.3);
        ctx.lineTo(0, s * 1.5);
        ctx.lineTo(-s * 0.4, s * 0.3);
        ctx.lineTo(-s * 1.5, 0);
        ctx.lineTo(-s * 0.4, -s * 0.3);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.8})`;
        ctx.fill();
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    class GoldDust {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.2 + 0.3;
        this.vy = -(Math.random() * 0.15 + 0.02);
        this.vx = (Math.random() - 0.5) * 0.1;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.02 + 0.005;
      }
      update() {
        this.y += this.vy;
        this.x += Math.sin(this.wobble) * 0.15;
        this.wobble += this.wobbleSpeed;
        if (this.y < -10) {
          this.y = canvas.height + 10;
          this.x = Math.random() * canvas.width;
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${this.opacity})`;
        ctx.fill();
      }
    }

    const particleCount = Math.min(60, Math.floor((canvas.width * canvas.height) / 20000));
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    const sparkleCount = Math.min(25, Math.floor((canvas.width * canvas.height) / 50000));
    for (let i = 0; i < sparkleCount; i++) sparkles.push(new Sparkle());

    const dustCount = Math.min(40, Math.floor((canvas.width * canvas.height) / 30000));
    for (let i = 0; i < dustCount; i++) goldDust.push(new GoldDust());

    function drawLines() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(201, 168, 76, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      goldDust.forEach(d => { d.update(); d.draw(); });
      particles.forEach(p => { p.update(); p.draw(); });
      drawLines();
      sparkles.forEach(s => { s.update(); s.draw(); });

      scrollSpeed *= 0.95;
      if (scrollSpeed < 0.01) scrollSpeed = 0;

      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}