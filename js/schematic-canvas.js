/**
 * Auto Schem - Holographic Green Isometric Schematic Canvas
 * Builds a Minecraft Heart and the word "FREE" in 3D green voxels.
 * No moving grid or moving background canvas.
 */

class SchematicViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.width = this.canvas.clientWidth || 600;
    this.height = this.canvas.clientHeight || 480;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Camera and isometric geometry
    this.angle = Math.PI / 4; // 45 deg isometric
    this.autoRotate = true;
    this.rotateSpeed = 0.007;
    this.blockSize = 18;
    this.originX = this.width / 2;
    this.originY = this.height / 2 + 40;

    // Blueprints: Heart and FREE
    this.blueprints = {
      heart: this.generateHeart(),
      free: this.generateFree()
    };
    this.currentBlueprintKey = 'heart';
    this.blueprint = this.blueprints.heart;
    
    this.placedCount = 0;
    this.isPaused = false;
    this.buildSpeed = 2; // blocks placed per frame
    this.particles = [];
    this.lasers = [];

    // Drag rotation controls
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.initEvents();
    this.resetSimulation();
    this.animate();
  }

  // 1. Generate 3D Minecraft Voxel Heart (Green Emerald Palette)
  generateHeart() {
    const blocks = [];
    
    // Heart layer pattern (Y: 0 to 6)
    const heartRows = [
      { y: 0, xs: [0] },
      { y: 1, xs: [-1, 0, 1] },
      { y: 2, xs: [-2, -1, 0, 1, 2] },
      { y: 3, xs: [-3, -2, -1, 0, 1, 2, 3] },
      { y: 4, xs: [-3, -2, -1, 0, 1, 2, 3] },
      { y: 5, xs: [-3, -2, -1, 0, 1, 2, 3] },
      { y: 6, xs: [-2, -1, 1, 2] } // top two rounded humps
    ];

    // Main Center Slice (Z = 0)
    heartRows.forEach(row => {
      row.xs.forEach(x => {
        let type = 'emerald';
        if (x === 0 && row.y === 3) type = 'lightGreen'; // shiny glint
        else if (Math.abs(x) === 1 && row.y === 4) type = 'lightGreen';
        else if (row.y === 0 || Math.abs(x) >= 3) type = 'darkGreen';
        blocks.push({ x, y: row.y, z: 0, type });
      });
    });

    // Front Depth Slice (Z = 1) - slightly inset for sculpted 3D bevel
    heartRows.forEach(row => {
      if (row.y >= 1 && row.y <= 5) {
        row.xs.forEach(x => {
          if (Math.abs(x) < 3) {
            blocks.push({ x, y: row.y, z: 1, type: (x === -1 && row.y === 4) ? 'lightGreen' : 'lime' });
          }
        });
      }
    });

    // Back Depth Slice (Z = -1)
    heartRows.forEach(row => {
      if (row.y >= 1 && row.y <= 5) {
        row.xs.forEach(x => {
          if (Math.abs(x) < 3) {
            blocks.push({ x, y: row.y, z: -1, type: 'darkGreen' });
          }
        });
      }
    });

    return blocks.sort((a, b) => a.y - b.y || (a.x + a.z) - (b.x + b.z));
  }

  // 2. Generate 3D Minecraft Voxels spelling "FREE" (All Green)
  generateFree() {
    const blocks = [];
    const zDepths = [0, 1]; // 3D block thickness

    zDepths.forEach(z => {
      const type = (z === 1) ? 'lime' : 'emerald';
      
      // Letter 'F' (X = -8 to -6)
      for (let y = 0; y <= 6; y++) {
        blocks.push({ x: -8, y, z, type });
      }
      blocks.push({ x: -7, y: 6, z, type });
      blocks.push({ x: -6, y: 6, z, type: 'lightGreen' });
      blocks.push({ x: -7, y: 3, z, type });
      blocks.push({ x: -6, y: 3, z, type });

      // Letter 'R' (X = -4 to -2)
      for (let y = 0; y <= 6; y++) {
        blocks.push({ x: -4, y, z, type });
      }
      blocks.push({ x: -3, y: 6, z, type });
      blocks.push({ x: -2, y: 6, z, type: 'lightGreen' });
      blocks.push({ x: -2, y: 5, z, type });
      blocks.push({ x: -2, y: 4, z, type });
      blocks.push({ x: -3, y: 3, z, type });
      blocks.push({ x: -2, y: 3, z, type });
      blocks.push({ x: -3, y: 2, z, type: 'darkGreen' });
      blocks.push({ x: -2, y: 1, z, type: 'darkGreen' });
      blocks.push({ x: -2, y: 0, z, type: 'darkGreen' });

      // Letter 'E' #1 (X = 0 to 2)
      for (let y = 0; y <= 6; y++) {
        blocks.push({ x: 0, y, z, type });
      }
      blocks.push({ x: 1, y: 6, z, type });
      blocks.push({ x: 2, y: 6, z, type: 'lightGreen' });
      blocks.push({ x: 1, y: 3, z, type });
      blocks.push({ x: 2, y: 3, z, type });
      blocks.push({ x: 1, y: 0, z, type });
      blocks.push({ x: 2, y: 0, z, type });

      // Letter 'E' #2 (X = 4 to 6)
      for (let y = 0; y <= 6; y++) {
        blocks.push({ x: 4, y, z, type });
      }
      blocks.push({ x: 5, y: 6, z, type });
      blocks.push({ x: 6, y: 6, z, type: 'lightGreen' });
      blocks.push({ x: 5, y: 3, z, type });
      blocks.push({ x: 6, y: 3, z, type });
      blocks.push({ x: 5, y: 0, z, type });
      blocks.push({ x: 6, y: 0, z, type });
    });

    return blocks.sort((a, b) => a.y - b.y || (a.x + a.z) - (b.x + b.z));
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.width = this.canvas.clientWidth || 600;
      this.height = this.canvas.clientHeight || 480;
      this.canvas.width = this.width * window.devicePixelRatio;
      this.canvas.height = this.height * window.devicePixelRatio;
      this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.originX = this.width / 2;
      this.originY = this.height / 2 + 40;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.autoRotate = false;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      this.angle += dx * 0.01;
      this.lastMouseX = e.clientX;
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.autoRotate = false;
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      this.angle += dx * 0.01;
      this.lastMouseX = e.touches[0].clientX;
    }, { passive: true });
  }

  setBlueprint(key) {
    if (this.blueprints[key]) {
      this.currentBlueprintKey = key;
      this.blueprint = this.blueprints[key];
      // Adjust block size slightly so FREE fits nicely
      this.blockSize = (key === 'free') ? 14 : 20;
      this.resetSimulation();
    }
  }

  resetSimulation() {
    this.placedCount = 0;
    this.particles = [];
    this.lasers = [];
    this.updateHUD();
  }

  updateHUD() {
    const placedEl = document.getElementById('hudPlacedBlocks');
    const totalEl = document.getElementById('hudTotalBlocks');
    const rateEl = document.getElementById('hudBuildRate');
    const layerEl = document.getElementById('hudCurrentLayer');

    if (placedEl) placedEl.textContent = this.placedCount.toString();
    if (totalEl) totalEl.textContent = this.blueprint.length.toString();
    if (rateEl) rateEl.textContent = (this.buildSpeed * 60) + ' bps';
    
    if (layerEl && this.blueprint.length > 0) {
      const curBlock = this.blueprint[Math.min(this.placedCount, this.blueprint.length - 1)];
      const maxLayer = Math.max(...this.blueprint.map(b => b.y));
      layerEl.textContent = `Y: ${curBlock.y} / ${maxLayer}`;
    }
  }

  // 3D Isometric projection
  project(x, y, z) {
    const cosA = Math.cos(this.angle);
    const sinA = Math.sin(this.angle);

    const rx = x * cosA - z * sinA;
    const rz = x * sinA + z * cosA;

    const isoX = (rx - rz) * Math.cos(Math.PI / 6) * this.blockSize;
    const isoY = (rx + rz) * Math.sin(Math.PI / 6) * this.blockSize * 0.58 - y * (this.blockSize * 0.85);

    return {
      x: this.originX + isoX,
      y: this.originY + isoY,
      depth: rz - rx
    };
  }

  // Draw isometric voxel cube in green palette
  drawBlock(x, y, z, type, isWireframe = false) {
    const p = this.project(x, y, z);
    const s = this.blockSize;
    const dx = Math.cos(Math.PI / 6) * s;
    const dy = Math.sin(Math.PI / 6) * s * 0.58;
    const h = s * 0.85;

    // Green Minecraft palettes
    const palettes = {
      emerald: {
        top: '#4ade80',
        left: '#22c55e',
        right: '#16a34a',
        edge: '#86efac',
        glow: true
      },
      lime: {
        top: '#86efac',
        left: '#4ade80',
        right: '#22c55e',
        edge: '#bbf7d0',
        glow: true
      },
      darkGreen: {
        top: '#16a34a',
        left: '#15803d',
        right: '#14532d',
        edge: '#22c55e',
        glow: false
      },
      lightGreen: {
        top: '#bbf7d0',
        left: '#86efac',
        right: '#4ade80',
        edge: '#ffffff',
        glow: true
      }
    };

    const color = palettes[type] || palettes.emerald;

    if (isWireframe) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.28;
      this.ctx.strokeStyle = '#4ade80';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([2, 2]);

      this.ctx.beginPath();
      // Top face
      this.ctx.moveTo(p.x, p.y - h);
      this.ctx.lineTo(p.x + dx, p.y - h + dy);
      this.ctx.lineTo(p.x, p.y - h + 2 * dy);
      this.ctx.lineTo(p.x - dx, p.y - h + dy);
      this.ctx.closePath();
      // Pillars
      this.ctx.moveTo(p.x - dx, p.y - h + dy);
      this.ctx.lineTo(p.x - dx, p.y + dy);
      this.ctx.moveTo(p.x + dx, p.y - h + dy);
      this.ctx.lineTo(p.x + dx, p.y + dy);
      this.ctx.moveTo(p.x, p.y - h + 2 * dy);
      this.ctx.lineTo(p.x, p.y + 2 * dy);
      // Bottom edges
      this.ctx.lineTo(p.x - dx, p.y + dy);
      this.ctx.moveTo(p.x, p.y + 2 * dy);
      this.ctx.lineTo(p.x + dx, p.y + dy);
      this.ctx.stroke();
      this.ctx.restore();
      return;
    }

    this.ctx.save();

    // Top Face
    this.ctx.fillStyle = color.top;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y - h);
    this.ctx.lineTo(p.x + dx, p.y - h + dy);
    this.ctx.lineTo(p.x, p.y - h + 2 * dy);
    this.ctx.lineTo(p.x - dx, p.y - h + dy);
    this.ctx.closePath();
    this.ctx.fill();

    // Left Face
    this.ctx.fillStyle = color.left;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x - dx, p.y - h + dy);
    this.ctx.lineTo(p.x, p.y - h + 2 * dy);
    this.ctx.lineTo(p.x, p.y + 2 * dy);
    this.ctx.lineTo(p.x - dx, p.y + dy);
    this.ctx.closePath();
    this.ctx.fill();

    // Right Face
    this.ctx.fillStyle = color.right;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y - h + 2 * dy);
    this.ctx.lineTo(p.x + dx, p.y - h + dy);
    this.ctx.lineTo(p.x + dx, p.y + dy);
    this.ctx.lineTo(p.x, p.y + 2 * dy);
    this.ctx.closePath();
    this.ctx.fill();

    // Glowing Neon Green Edges
    this.ctx.strokeStyle = color.edge;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y - h);
    this.ctx.lineTo(p.x + dx, p.y - h + dy);
    this.ctx.lineTo(p.x, p.y - h + 2 * dy);
    this.ctx.lineTo(p.x - dx, p.y - h + dy);
    this.ctx.closePath();
    this.ctx.moveTo(p.x, p.y - h + 2 * dy);
    this.ctx.lineTo(p.x, p.y + 2 * dy);
    this.ctx.stroke();

    if (color.glow) {
      this.ctx.shadowColor = '#4ade80';
      this.ctx.shadowBlur = 6;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  // Laser beam and particle animation when a block is placed (Green)
  spawnPlacementEffects(block) {
    const p = this.project(block.x, block.y, block.z);
    
    // Green Laser beam from overhead
    this.lasers.push({
      startX: p.x + (Math.random() - 0.5) * 60,
      startY: 30,
      targetX: p.x,
      targetY: p.y - this.blockSize * 0.5,
      life: 1.0,
      color: '#4ade80'
    });

    // Green Particle explosion (emerald sparks)
    for (let i = 0; i < 5; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.2;
      this.particles.push({
        x: p.x,
        y: p.y - this.blockSize * 0.5,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 0.8,
        life: 1.0,
        decay: 0.03 + Math.random() * 0.03,
        color: Math.random() > 0.4 ? '#4ade80' : '#86efac',
        size: 2 + Math.random() * 2
      });
    }
  }

  render() {
    // Clear canvas - clean steady background, NO moving grid
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Static steady base platform in dark green
    this.drawStaticBase();

    // Determine sorted blocks based on camera depth
    const sortedBlocks = [...this.blueprint].map((b, idx) => {
      const proj = this.project(b.x, b.y, b.z);
      return { ...b, proj, origIndex: idx };
    }).sort((a, b) => a.proj.depth - b.proj.depth);

    // 1. Draw ghost blueprint wireframes (remaining blocks)
    sortedBlocks.forEach(b => {
      if (b.origIndex >= this.placedCount) {
        this.drawBlock(b.x, b.y, b.z, b.type, true);
      }
    });

    // 2. Draw placed solid green blocks
    sortedBlocks.forEach(b => {
      if (b.origIndex < this.placedCount) {
        this.drawBlock(b.x, b.y, b.z, b.type, false);
      }
    });

    // 3. Draw green laser beams
    this.ctx.save();
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      this.ctx.globalAlpha = l.life;
      this.ctx.strokeStyle = l.color;
      this.ctx.lineWidth = 2.5 * l.life;
      this.ctx.shadowColor = '#22c55e';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.moveTo(l.startX, l.startY);
      this.ctx.lineTo(l.targetX, l.targetY);
      this.ctx.stroke();

      l.life -= 0.14;
      if (l.life <= 0) {
        this.lasers.splice(i, 1);
      }
    }
    this.ctx.restore();

    // 4. Draw green sparks
    this.ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = '#4ade80';
      this.ctx.shadowBlur = 6;
      this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    this.ctx.restore();
  }

  // Draw clean, static platform (no moving grid lines)
  drawStaticBase() {
    const range = (this.currentBlueprintKey === 'free') ? 9 : 5;
    const p1 = this.project(-range, 0, -3);
    const p2 = this.project(range, 0, -3);
    const p3 = this.project(range, 0, 3);
    const p4 = this.project(-range, 0, 3);

    this.ctx.save();
    this.ctx.fillStyle = 'rgba(21, 128, 61, 0.06)';
    this.ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.lineTo(p3.x, p3.y);
    this.ctx.lineTo(p4.x, p4.y);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  animate() {
    if (this.autoRotate && !this.isDragging) {
      this.angle += this.rotateSpeed;
    }

    // Step build automation
    if (!this.isPaused) {
      for (let s = 0; s < this.buildSpeed; s++) {
        if (this.placedCount < this.blueprint.length) {
          const blk = this.blueprint[this.placedCount];
          this.spawnPlacementEffects(blk);
          this.placedCount++;
        } else {
          // Pause then loop restart
          setTimeout(() => {
            if (this.placedCount >= this.blueprint.length) {
              this.resetSimulation();
            }
          }, 3000);
          break;
        }
      }
      this.updateHUD();
    }

    this.render();
    requestAnimationFrame(() => this.animate());
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.schematicViewer = new SchematicViewer('schematicCanvas');
});
