'use strict';

// 8 item pairs with VERY SUBTLE differences between good and bad
const ITEMS = [
    {
        name: 'Diamond',
        goodLabel: 'Real Diamond',
        badLabel: 'Fake Diamond',
        hint: 'Check the left facet',
        draw(ctx, size, isGood) {
            const cx = size / 2, cy = size / 2, s = size * 0.3;
            ctx.save();
            // Shadow glow
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 15;
            // Diamond shape
            ctx.beginPath();
            const leftW = isGood ? s * 0.7 : s * 0.55; // bad: left side narrower
            ctx.moveTo(cx, cy - s);
            ctx.lineTo(cx + s * 0.7, cy - s * 0.15);
            ctx.lineTo(cx + s * 0.5, cy + s * 0.7);
            ctx.lineTo(cx - s * 0.5, cy + s * 0.7);
            ctx.lineTo(cx - leftW, cy - s * 0.15);
            ctx.closePath();
            const grad = ctx.createLinearGradient(cx - s, cy - s, cx + s, cy + s);
            grad.addColorStop(0, '#88ccff');
            grad.addColorStop(0.5, '#4488ff');
            grad.addColorStop(1, '#2255cc');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = '#aaddff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Inner facet lines
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(cx, cy - s);
            ctx.lineTo(cx - s * 0.1, cy + s * 0.7);
            ctx.moveTo(cx, cy - s);
            ctx.lineTo(cx + s * 0.15, cy + s * 0.7);
            ctx.moveTo(cx - leftW, cy - s * 0.15);
            ctx.lineTo(cx + s * 0.7, cy - s * 0.15);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Sparkle
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.beginPath();
            ctx.arc(cx - s * 0.2, cy - s * 0.4, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'Potion',
        goodLabel: 'Health Potion',
        badLabel: 'Poison',
        hint: 'Look at the liquid color',
        draw(ctx, size, isGood) {
            const cx = size / 2, cy = size / 2, s = size * 0.22;
            ctx.save();
            // Bottle neck
            ctx.fillStyle = 'rgba(180,200,220,0.3)';
            ctx.strokeStyle = 'rgba(180,200,220,0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx - s * 0.35, cy - s * 2.5, s * 0.7, s * 1.2, 3);
            ctx.fill(); ctx.stroke();
            // Bottle body
            ctx.beginPath();
            ctx.roundRect(cx - s * 1.1, cy - s * 1.3, s * 2.2, s * 2.8, 10);
            ctx.fill(); ctx.stroke();
            // Cork
            ctx.fillStyle = '#8B6914';
            ctx.beginPath();
            ctx.roundRect(cx - s * 0.45, cy - s * 2.8, s * 0.9, s * 0.5, 3);
            ctx.fill();
            // Liquid - SUBTLE: good=#33dd55, bad=#55cc33
            const liquidColor = isGood ? '#33dd55' : '#55cc33';
            ctx.fillStyle = liquidColor;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.roundRect(cx - s * 0.95, cy - s * 0.7, s * 1.9, s * 2.1, [0, 0, 8, 8]);
            ctx.fill();
            ctx.globalAlpha = 1;
            // Liquid shine
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(cx - s * 0.3, cy, s * 0.3, s * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            // Bubbles
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.arc(cx + s * 0.3, cy + s * 0.2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx - s * 0.1, cy + s * 0.6, 2, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'Gold Coin',
        goodLabel: 'Gold Coin',
        badLabel: "Fool's Gold",
        hint: 'Check the star emblem',
        draw(ctx, size, isGood) {
            const cx = size / 2, cy = size / 2, r = size * 0.3;
            ctx.save();
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 12;
            // Coin body
            const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
            grad.addColorStop(0, '#ffe566');
            grad.addColorStop(0.7, '#ffcc00');
            grad.addColorStop(1, '#cc9900');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            // Rim
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#aa8800';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(170,136,0,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Star emblem - SUBTLE: bad has thinner arms
            const armW = isGood ? 0.38 : 0.28;
            ctx.fillStyle = 'rgba(170,136,0,0.5)';
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const a1 = (i * 72 - 90) * Math.PI / 180;
                const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
                const outerR = r * 0.55;
                const innerR = r * armW;
                if (i === 0) ctx.moveTo(cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR);
                else ctx.lineTo(cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR);
                ctx.lineTo(cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'Apple',
        goodLabel: 'Fresh Apple',
        badLabel: 'Rotten Apple',
        hint: 'Look for brown spots',
        draw(ctx, size, isGood) {
            const cx = size / 2, cy = size / 2 + 5, r = size * 0.28;
            ctx.save();
            // Apple body
            const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.5, 0, cx, cy, r * 1.2);
            grad.addColorStop(0, '#ff4444');
            grad.addColorStop(0.6, '#dd2222');
            grad.addColorStop(1, '#aa1111');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx - r * 0.25, cy, r * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + r * 0.25, cy, r * 0.85, 0, Math.PI * 2);
            ctx.fill();
            // Stem
            ctx.strokeStyle = '#553311';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy - r * 0.7);
            ctx.quadraticCurveTo(cx + 4, cy - r * 1.1, cx + 2, cy - r * 1.3);
            ctx.stroke();
            // Leaf
            ctx.fillStyle = '#44aa33';
            ctx.beginPath();
            ctx.ellipse(cx + 8, cy - r * 1.05, 8, 4, 0.4, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.ellipse(cx - r * 0.35, cy - r * 0.3, r * 0.2, r * 0.35, -0.3, 0, Math.PI * 2);
            ctx.fill();
            // SUBTLE: bad apple has tiny brown spot
            if (!isGood) {
                ctx.fillStyle = '#664422';
                ctx.beginPath();
                ctx.arc(cx + r * 0.3, cy + r * 0.35, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    },
    {
        name: 'Mushroom',
        goodLabel: 'Edible Mushroom',
        badLabel: 'Poison Mushroom',
        hint: 'Check the cap color',
        draw(ctx, size, isGood) {
            const cx = size / 2, cy = size / 2 + 10, s = size * 0.25;
            ctx.save();
            // Stem
            ctx.fillStyle = '#f5e6d3';
            ctx.beginPath();
            ctx.moveTo(cx - s * 0.4, cy);
            ctx.lineTo(cx - s * 0.5, cy + s * 1.2);
            ctx.lineTo(cx + s * 0.5, cy + s * 1.2);
            ctx.lineTo(cx + s * 0.4, cy);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#d4c4b0';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Cap - SUBTLE: good=#dd2222, bad=#dd3318
            const capColor = isGood ? '#dd2222' : '#dd3318';
            ctx.fillStyle = capColor;
            ctx.beginPath();
            ctx.arc(cx, cy - s * 0.1, s * 1.1, Math.PI, 0, false);
            ctx.quadraticCurveTo(cx + s * 1.3, cy + s * 0.15, cx + s * 0.6, cy + s * 0.1);
            ctx.lineTo(cx - s * 0.6, cy + s * 0.1);
            ctx.quadraticCurveTo(cx - s * 1.3, cy + s * 0.15, cx - s * 1.1, cy - s * 0.1);
            ctx.fill();
            // White spots
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath(); ctx.arc(cx - s * 0.4, cy - s * 0.5, s * 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + s * 0.35, cy - s * 0.55, s * 0.18, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx, cy - s * 0.85, s * 0.15, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + s * 0.7, cy - s * 0.2, s * 0.12, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'Crown',
        goodLabel: 'Royal Crown',
        badLabel: 'Cursed Crown',
        hint: 'Check the middle point',
        draw(ctx, size, isGood) {
            const cx = size / 2, cy = size / 2 + 5, s = size * 0.25;
            ctx.save();
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 10;
            const midH = isGood ? s * 1.6 : s * 1.4; // bad: middle shorter
            // Crown shape
            ctx.beginPath();
            ctx.moveTo(cx - s * 1.3, cy + s * 0.3);
            ctx.lineTo(cx - s * 1.1, cy - s * 1.0);
            ctx.lineTo(cx - s * 0.5, cy - s * 0.3);
            ctx.lineTo(cx, cy - midH);
            ctx.lineTo(cx + s * 0.5, cy - s * 0.3);
            ctx.lineTo(cx + s * 1.1, cy - s * 1.0);
            ctx.lineTo(cx + s * 1.3, cy + s * 0.3);
            ctx.closePath();
            const grad = ctx.createLinearGradient(cx, cy - s * 1.6, cx, cy + s * 0.3);
            grad.addColorStop(0, '#ffe855');
            grad.addColorStop(0.5, '#ffcc00');
            grad.addColorStop(1, '#cc9900');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = '#aa8800';
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 0;
            ctx.stroke();
            // Base band
            ctx.fillStyle = '#cc9900';
            ctx.fillRect(cx - s * 1.3, cy + s * 0.1, s * 2.6, s * 0.35);
            // Gems on crown
            ctx.fillStyle = '#ff3355';
            ctx.beginPath(); ctx.arc(cx - s * 0.55, cy - s * 0.15, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#3366ff';
            ctx.beginPath(); ctx.arc(cx, cy + s * 0.2, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#33cc55';
            ctx.beginPath(); ctx.arc(cx + s * 0.55, cy - s * 0.15, 4, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'Ring',
        goodLabel: 'Magic Ring',
        badLabel: 'Cursed Ring',
        hint: 'Look at the gem shape',
        draw(ctx, size, isGood) {
            const cx = size / 2, cy = size / 2 + 10, s = size * 0.22;
            ctx.save();
            // Ring band
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.ellipse(cx, cy + s * 0.5, s * 1.2, s * 0.8, 0, 0, Math.PI * 2);
            ctx.stroke();
            // Setting
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ddaa00';
            ctx.beginPath();
            ctx.moveTo(cx - s * 0.5, cy - s * 0.15);
            ctx.lineTo(cx - s * 0.35, cy - s * 0.65);
            ctx.lineTo(cx + s * 0.35, cy - s * 0.65);
            ctx.lineTo(cx + s * 0.5, cy - s * 0.15);
            ctx.closePath();
            ctx.fill();
            // Gem - SUBTLE: bad is slightly oval (wider)
            const gemRX = isGood ? s * 0.5 : s * 0.58;
            const gemRY = s * 0.5;
            ctx.fillStyle = '#4488ff';
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.ellipse(cx, cy - s * 0.65, gemRX, gemRY, 0, 0, Math.PI * 2);
            ctx.fill();
            // Gem highlight
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath();
            ctx.ellipse(cx - s * 0.15, cy - s * 0.85, s * 0.15, s * 0.1, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    },
    {
        name: 'Treasure Chest',
        goodLabel: 'Treasure',
        badLabel: 'Mimic',
        hint: 'Peek inside the chest',
        draw(ctx, size, isGood) {
            const cx = size / 2, cy = size / 2, s = size * 0.25;
            ctx.save();
            // Chest body
            const bodyGrad = ctx.createLinearGradient(cx, cy - s, cx, cy + s);
            bodyGrad.addColorStop(0, '#8B5E3C');
            bodyGrad.addColorStop(1, '#5C3A1E');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.roundRect(cx - s * 1.2, cy - s * 0.2, s * 2.4, s * 1.5, 4);
            ctx.fill();
            ctx.strokeStyle = '#3E2112';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Lid (open)
            ctx.fillStyle = '#7B4E2C';
            ctx.beginPath();
            ctx.moveTo(cx - s * 1.25, cy - s * 0.2);
            ctx.lineTo(cx - s * 1.1, cy - s * 1.0);
            ctx.quadraticCurveTo(cx, cy - s * 1.35, cx + s * 1.1, cy - s * 1.0);
            ctx.lineTo(cx + s * 1.25, cy - s * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Metal bands
            ctx.fillStyle = '#aa8833';
            ctx.fillRect(cx - s * 1.2, cy - s * 0.2, s * 2.4, s * 0.15);
            ctx.fillRect(cx - s * 0.1, cy - s * 0.2, s * 0.2, s * 1.5);
            // Lock
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.arc(cx, cy - s * 0.1, s * 0.15, 0, Math.PI * 2);
            ctx.fill();
            // Inside - dark opening
            ctx.fillStyle = '#1a0e05';
            ctx.fillRect(cx - s * 0.9, cy - s * 0.15, s * 1.8, s * 0.4);
            if (isGood) {
                // Gold glow inside
                ctx.fillStyle = '#ffdd44';
                ctx.shadowColor = '#ffcc00';
                ctx.shadowBlur = 8;
                ctx.beginPath(); ctx.arc(cx - s * 0.3, cy + s * 0.05, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + s * 0.2, cy, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx, cy + s * 0.08, 4.5, 0, Math.PI * 2); ctx.fill();
            } else {
                // Tiny red eyes in the dark
                ctx.fillStyle = '#ff2222';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 4;
                ctx.beginPath(); ctx.arc(cx - s * 0.25, cy, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(cx + s * 0.25, cy, 3, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        }
    }
];

function drawItem(canvas, itemIndex, isGood) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ITEMS[itemIndex].draw(ctx, size, isGood);
}

function renderGuide(container) {
    container.innerHTML = '';
    ITEMS.forEach((item, idx) => {
        const pair = document.createElement('div');
        pair.className = 'guide-pair';
        // Good thumbnail
        const gc = document.createElement('canvas');
        gc.width = 40; gc.height = 40;
        item.draw(gc.getContext('2d'), 40, true);
        // Bad thumbnail
        const bc = document.createElement('canvas');
        bc.width = 40; bc.height = 40;
        item.draw(bc.getContext('2d'), 40, false);
        pair.innerHTML = `<span class="guide-good">✓</span>`;
        pair.insertBefore(gc, pair.firstChild);
        pair.appendChild(document.createTextNode(' '));
        const badSpan = document.createElement('span');
        badSpan.className = 'guide-bad';
        badSpan.textContent = '✗';
        pair.appendChild(bc);
        pair.appendChild(badSpan);
        const hint = document.createElement('span');
        hint.style.cssText = 'font-size:0.65rem;color:#666;margin-left:4px';
        hint.textContent = item.hint;
        pair.appendChild(hint);
        container.appendChild(pair);
    });
}
