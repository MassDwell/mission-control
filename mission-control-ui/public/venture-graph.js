/**
 * CR-MC-PALANTIR: Venture Relationship Graph
 * Lightweight SVG force-directed graph (no D3, no external libs)
 * Data source: /api/venture-graph (venture_relationships.json)
 *
 * Nodes: ventures (blue), workstreams (green), agents (red), blockers (orange)
 * Edges: relationships (thick = strong, thin = weak)
 * Interactive: click → drill into context, drag nodes
 */

(function() {
  'use strict';

  const COLORS = {
    venture:    '#3b82f6',
    workstream: '#22c55e',
    agent:      '#ef4444',
    blocker:    '#f97316'
  };

  const NODE_RADIUS = {
    venture:    18,
    workstream: 12,
    agent:      14,
    blocker:    10
  };

  let svgEl    = null;
  let tooltip  = null;
  let nodes    = [];
  let edges    = [];
  let width    = 700;
  let height   = 280;
  let animId   = null;
  let dragging = null;
  let offsetX  = 0;
  let offsetY  = 0;

  /**
   * Build node/edge lists from graph data
   */
  function buildGraph(data) {
    nodes = [];
    edges = [];

    const nodeMap = {};

    // Add ventures
    (data.ventures || []).forEach(v => {
      const node = {
        id:     v.id,
        label:  v.name,
        type:   'venture',
        data:   v,
        x:      width * 0.3 + (Math.random() - 0.5) * 100,
        y:      height * 0.5 + (Math.random() - 0.5) * 80,
        vx: 0, vy: 0
      };
      nodes.push(node);
      nodeMap[v.id] = node;
    });

    // Add workstreams
    (data.workstreams || []).forEach(ws => {
      const node = {
        id:    ws.id,
        label: ws.name,
        type:  'workstream',
        data:  ws,
        x:     width * 0.6 + (Math.random() - 0.5) * 120,
        y:     height * 0.5 + (Math.random() - 0.5) * 100,
        vx: 0, vy: 0
      };
      nodes.push(node);
      nodeMap[ws.id] = node;

      // Edge: workstream → venture
      if (ws.venture_id && nodeMap[ws.venture_id]) {
        edges.push({ source: ws.venture_id, target: ws.id, strength: 'strong' });
      }
    });

    // Add agents
    (data.agents || []).forEach(agent => {
      const node = {
        id:    agent.id,
        label: agent.name,
        type:  'agent',
        data:  agent,
        x:     width * 0.1 + (Math.random() - 0.5) * 60,
        y:     height * 0.5 + (Math.random() - 0.5) * 80,
        vx: 0, vy: 0
      };
      nodes.push(node);
      nodeMap[agent.id] = node;

      // Edges: agent → owned workstreams
      (agent.owned_workstreams || []).forEach(wsId => {
        if (nodeMap[wsId]) {
          edges.push({ source: agent.id, target: wsId, strength: 'normal' });
        }
      });
    });

    // Add blockers
    (data.blockers || []).forEach(b => {
      const node = {
        id:    b.id || `blocker-${Math.random().toString(36).slice(2)}`,
        label: b.description ? b.description.slice(0, 20) + '…' : 'Blocker',
        type:  'blocker',
        data:  b,
        x:     width * 0.5 + (Math.random() - 0.5) * 80,
        y:     height * 0.2 + (Math.random() - 0.5) * 40,
        vx: 0, vy: 0
      };
      nodes.push(node);
      nodeMap[node.id] = node;

      if (b.venture_id && nodeMap[b.venture_id]) {
        edges.push({ source: node.id, target: b.venture_id, strength: 'strong' });
      }
    });

    return { nodeMap };
  }

  /**
   * Simple force-directed layout tick
   */
  function tick(nodeMap) {
    const REPEL    = 800;
    const ATTRACT  = 0.03;
    const DAMPING  = 0.85;
    const CENTER_X = width  * 0.5;
    const CENTER_Y = height * 0.5;

    // Gravity toward center
    nodes.forEach(n => {
      if (dragging && n.id === dragging.id) return;
      n.vx += (CENTER_X - n.x) * 0.003;
      n.vy += (CENTER_Y - n.y) * 0.003;
    });

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPEL / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Spring attraction along edges
    edges.forEach(e => {
      const s = nodeMap[e.source], t = nodeMap[e.target];
      if (!s || !t) return;
      const dx = t.x - s.x, dy = t.y - s.y;
      const dist    = Math.sqrt(dx * dx + dy * dy) || 1;
      const restLen = e.strength === 'strong' ? 80 : 130;
      const force   = (dist - restLen) * ATTRACT;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      s.vx += fx; s.vy += fy;
      t.vx -= fx; t.vy -= fy;
    });

    // Integrate + dampen
    nodes.forEach(n => {
      if (dragging && n.id === dragging.id) return;
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x  += n.vx;
      n.y  += n.vy;
      // Clamp to bounds
      const r = NODE_RADIUS[n.type] || 12;
      n.x = Math.max(r + 4, Math.min(width - r - 4, n.x));
      n.y = Math.max(r + 4, Math.min(height - r - 4, n.y));
    });
  }

  /**
   * Render graph to SVG
   */
  function render(nodeMap) {
    if (!svgEl) return;

    // Clear
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    // Draw edges
    edges.forEach(e => {
      const s = nodeMap[e.source], t = nodeMap[e.target];
      if (!s || !t) return;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', s.x);
      line.setAttribute('y1', s.y);
      line.setAttribute('x2', t.x);
      line.setAttribute('y2', t.y);
      line.setAttribute('stroke', e.strength === 'strong' ? '#3a4060' : '#252d40');
      line.setAttribute('stroke-width', e.strength === 'strong' ? '2' : '1');
      line.setAttribute('stroke-dasharray', e.strength === 'normal' ? '4,3' : '');
      svgEl.appendChild(line);
    });

    // Draw nodes
    nodes.forEach(n => {
      const r     = NODE_RADIUS[n.type] || 12;
      const color = COLORS[n.type]      || '#8892a4';

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'graph-node');
      g.setAttribute('data-id', n.id);
      g.setAttribute('data-type', n.type);

      // Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', n.x);
      circle.setAttribute('cy', n.y);
      circle.setAttribute('r', r);
      circle.setAttribute('fill', color + '22');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '2');
      g.appendChild(circle);

      // Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', n.x);
      text.setAttribute('y', n.y + r + 13);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '9');
      text.setAttribute('fill', '#8892a4');
      text.textContent = n.label.length > 14 ? n.label.slice(0, 12) + '…' : n.label;
      g.appendChild(text);

      // Progress indicator for workstreams
      if (n.type === 'workstream' && n.data.progress) {
        const prog   = n.data.progress / 100;
        const circum = 2 * Math.PI * r;
        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        arc.setAttribute('cx', n.x);
        arc.setAttribute('cy', n.y);
        arc.setAttribute('r', r);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', color);
        arc.setAttribute('stroke-width', '3');
        arc.setAttribute('stroke-dasharray', `${prog * circum} ${circum}`);
        arc.setAttribute('stroke-dashoffset', circum / 4); // Start from top
        arc.setAttribute('transform', `rotate(-90 ${n.x} ${n.y})`);
        g.appendChild(arc);
      }

      // Mouse events
      g.addEventListener('mouseenter', (ev) => showTooltip(ev, n));
      g.addEventListener('mouseleave', ()  => hideTooltip());
      g.addEventListener('click',      ()  => handleNodeClick(n));
      g.addEventListener('mousedown',  (ev) => startDrag(ev, n));

      svgEl.appendChild(g);
    });
  }

  function showTooltip(ev, node) {
    if (!tooltip) return;
    let details = '';
    if (node.type === 'workstream') {
      details = `Owner: ${node.data.owner_agent || node.data.owner || '—'} | Progress: ${node.data.progress || 0}%`;
    } else if (node.type === 'venture') {
      details = `Stage: ${node.data.stage || '—'} | Owner: ${node.data.owner_agent || '—'}`;
    } else if (node.type === 'agent') {
      details = `Role: ${node.data.role || '—'} | Workstreams: ${(node.data.owned_workstreams || []).length}`;
    } else if (node.type === 'blocker') {
      details = `Venture: ${node.data.venture_id || '—'}`;
    }

    tooltip.innerHTML = `
      <strong>${node.label}</strong>
      <div class="graph-tooltip-type">${node.type}</div>
      <div class="graph-tooltip-detail">${details}</div>
    `;
    tooltip.style.display = 'block';
    tooltip.style.left    = (ev.pageX + 12) + 'px';
    tooltip.style.top     = (ev.pageY - 8)  + 'px';
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none';
  }

  function handleNodeClick(node) {
    if (node.type === 'venture' && window.MissionControlDrilldown) {
      // Open venture in the existing drilldown
      window.MissionControlDrilldown.openVenture && window.MissionControlDrilldown.openVenture(node.id);
    }
  }

  function startDrag(ev, node) {
    dragging = node;
    const rect = svgEl.getBoundingClientRect();
    offsetX = ev.clientX - rect.left - node.x;
    offsetY = ev.clientY - rect.top  - node.y;
    ev.preventDefault();
  }

  function onMouseMove(ev) {
    if (!dragging || !svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    dragging.x  = ev.clientX - rect.left - offsetX;
    dragging.y  = ev.clientY - rect.top  - offsetY;
    dragging.vx = 0;
    dragging.vy = 0;
  }

  function onMouseUp() {
    dragging = null;
  }

  /**
   * Main animation loop
   */
  function animate(nodeMap) {
    tick(nodeMap);
    render(nodeMap);
    animId = requestAnimationFrame(() => animate(nodeMap));
  }

  /**
   * Stop animation after graph settles
   */
  function autoStop(nodeMap, iterations = 200) {
    let count = 0;
    function step() {
      tick(nodeMap);
      render(nodeMap);
      count++;
      if (count < iterations) {
        animId = requestAnimationFrame(step);
      } else {
        // After settling, continue at lower FPS for dragging
        animId = setInterval(() => render(nodeMap), 100);
      }
    }
    step();
  }

  /**
   * Initialize the graph in a container element
   */
  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Measure container
    const rect = container.getBoundingClientRect();
    width  = rect.width  || 700;
    height = rect.height || 280;

    // Create SVG
    svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('id', 'venture-graph-svg');
    svgEl.setAttribute('width',  width);
    svgEl.setAttribute('height', height);
    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    container.innerHTML = '';
    container.appendChild(svgEl);

    // Create tooltip
    tooltip = document.createElement('div');
    tooltip.className = 'graph-tooltip';
    document.body.appendChild(tooltip);

    // Mouse events for drag
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);

    // Fetch graph data
    fetch('/api/venture-graph')
      .then(r => r.json())
      .then(data => {
        const { nodeMap } = buildGraph(data);
        if (animId) {
          clearInterval(animId);
          cancelAnimationFrame(animId);
        }
        autoStop(nodeMap);
      })
      .catch(err => {
        console.error('[VENTURE-GRAPH] Load failed:', err.message);
        container.innerHTML = '<div class="graph-empty">Graph data unavailable</div>';
      });
  }

  /**
   * Destroy and cleanup
   */
  function destroy() {
    if (animId) {
      clearInterval(animId);
      cancelAnimationFrame(animId);
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup',   onMouseUp);
    if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
    tooltip = null;
  }

  // Public API
  window.VentureGraph = { init, destroy };
})();
