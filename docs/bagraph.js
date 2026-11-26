'use strict';

const octants = {
  "100": {
    "element": "Air",
    "display": "Air",
    "name": "Hollow Fixes",
    "color": "#9CA3AF",
    "edge": "#6B7280",
    "desc": "Low impact · not easy · independent"
  },
  "101": {
    "element": "Lightning",
    "display": "Lightning",
    "name": "Quick Fixes",
    "color": "#FFF200",
    "edge": "#E8CB35",
    "desc": "Low impact · easy · independent"
  },
  "110": {
    "element": "Fire",
    "display": "Fire",
    "name": "Major Fixes",
    "color": "#DC2626",
    "edge": "#E05252",
    "desc": "High impact · not easy · independent"
  },
  "111": {
    "element": "Heaven",
    "display": "Heaven",
    "name": "Major Wins",
    "color": "#EAF6FF",
    "edge": "#93C5FD",
    "desc": "High impact · easy · independent"
  },
  "010": {
    "element": "Mountain",
    "display": "Mountain",
    "name": "Distant Peaks",
    "color": "#874018",
    "edge": "#663011",
    "desc": "High impact · not easy · dependent"
  },
  "011": {
    "element": "Water",
    "display": "Water",
    "name": "Stagnant Potential",
    "color": "#06B6D4",
    "edge": "#0E7490",
    "desc": "High impact · easy · dependent"
  },
  "001": {
    "element": "Earth",
    "display": "Earth",
    "name": "Deferred Polish",
    "color": "#C26D1F",
    "edge": "#92400E",
    "desc": "Low impact · easy · dependent"
  },
  "000": {
    "element": "Swamp",
    "display": "Swamp",
    "name": "Costly Quagmires",
    "color": "#567A37",
    "edge": "#3F5B2A",
    "desc": "Low impact · not easy · dependent"
  }
};

function parseIssues(markdown) {
  const lines = markdown.split(/\r?\n/);
  const cells = line => line.trim().slice(1,-1).split('|').map(v=>v.trim());
  const start=lines.findIndex(l=>l.trim().startsWith('|') && cells(l).join('|')==='ID|Title|Impact|Ease');
  if(start<0 || !/^\s*\|(?:\s*:?-{3,}:?\s*\|){4}\s*$/.test(lines[start+1]||'')) throw Error('Missing issues table or separator (ID | Title | Impact | Ease).');
  const issues=[]; const seen=new Set();
  for(let n=start+2;n<lines.length && lines[n].trim().startsWith('|');n++){
    if(!lines[n].trim().endsWith('|')) throw Error(`Invalid issues row ${n+1}.`);
    const c=cells(lines[n]); const [id,title,impact,ease]=c;
    if(c.length!==4 || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)||!title) throw Error(`Invalid issues row ${n+1}.`);
    if(seen.has(id)) throw Error(`Duplicate issue ID: ${id}.`);
    if(!/^(?:[1-9]|10)$/.test(impact)||!/^(?:[1-9]|10)$/.test(ease)) throw Error(`Impact and Ease must be integers from 1 to 10: ${id}.`);
    seen.add(id); issues.push({id,title,impact:Number(impact),ease:Number(ease)});
  }
  if(!issues.length) throw Error('The issues table is empty.');
  return issues;
}

function parseDependencies(markdown) {
  const blocks=[...markdown.matchAll(/^```mermaid[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm)];
  if(blocks.length!==1) throw Error('Expected exactly one Mermaid dependency block.');
  const lines=blocks[0][1].split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('%%'));
  if(!/^(?:graph|flowchart)\s+(?:TD|TB|LR|RL|BT)$/.test(lines.shift()||'')) throw Error('Expected a Mermaid graph direction.');
  const seen=new Set();
  return lines.map(line=>{
    const m=line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*-->\s*([A-Za-z][A-Za-z0-9_-]*)$/);
    if(!m) throw Error(`Unsupported dependency syntax: ${line}`);
    const key=m[1]+'|'+m[2]; if(seen.has(key)) throw Error(`Duplicate dependency: ${line}`);
    seen.add(key); return [m[1],m[2]];
  });
}

function classifyIssues(raw, edges, categories) {
  const nodes=new Map(raw.map(i=>[i.id,{...i,depends:[],children:[]}]));
  for(const [from,to] of edges){
    if(!nodes.has(from)||!nodes.has(to)) throw Error(`Unknown issue in dependency: ${from} --> ${to}`);
    nodes.get(from).children.push(to); nodes.get(to).depends.push(from);
  }
  const memo=new Map(), active=new Set();
  function descendants(id) {
    if(active.has(id)) throw Error(`Circular dependency involving ${id}.`);
    if(memo.has(id)) return memo.get(id);
    active.add(id); const out=new Set();
    for(const child of nodes.get(id).children){out.add(child);for(const d of descendants(child))out.add(d);}
    active.delete(id);memo.set(id,out);return out;
  }
  return raw.map(({id,title,impact,ease})=>{
    const {depends}=nodes.get(id); const downstream=descendants(id);
    const independent=Number(depends.length===0);
    const unlockCount=downstream.size;
    const unlockPower=[...downstream].reduce((sum,d)=>sum+nodes.get(d).impact,0);
    const bits=`${independent}${Number(impact>=6)}${Number(ease>=6)}`;
    const meta=categories[bits];
    return {id,title,impact,ease,independent,depends,unlockCount,unlockPower,bits,octant:meta.name,element:meta.element,display:meta.display,color:meta.color,edge:meta.edge,markerSize:unlockCount?Math.round((17+Math.min(unlockPower,24)*.35)*10)/10:9,symbol:unlockCount?'diamond':'circle'};
  });
}

function renderPlot(issues) {
const groups = {};
issues.forEach(i => { (groups[i.bits] ||= []).push(i); });

function cuboidMesh(name, color, opacity, x0, x1, y0, y1, z0, z1) {
  const x = [x0,x1,x1,x0,x0,x1,x1,x0];
  const y = [y0,y0,y1,y1,y0,y0,y1,y1];
  const z = [z0,z0,z0,z0,z1,z1,z1,z1];
  const i = [0,0,4,4,0,0,1,1,2,2,3,3];
  const j = [2,3,5,6,1,5,2,6,3,7,0,4];
  const k = [1,2,6,7,5,4,6,5,7,6,4,7];
  return { type:'mesh3d', name, x, y, z, i, j, k, color, opacity, hoverinfo:'skip', showscale:false, legendgroup:'volumes', showlegend:false };
}
function cuboidEdges(name, color, x0, x1, y0, y1, z0, z1) {
  const pts = [
    [[x0,y0,z0],[x1,y0,z0]], [[x1,y0,z0],[x1,y1,z0]], [[x1,y1,z0],[x0,y1,z0]], [[x0,y1,z0],[x0,y0,z0]],
    [[x0,y0,z1],[x1,y0,z1]], [[x1,y0,z1],[x1,y1,z1]], [[x1,y1,z1],[x0,y1,z1]], [[x0,y1,z1],[x0,y0,z1]],
    [[x0,y0,z0],[x0,y0,z1]], [[x1,y0,z0],[x1,y0,z1]], [[x1,y1,z0],[x1,y1,z1]], [[x0,y1,z0],[x0,y1,z1]],
  ];
  const x = [], y = [], z = [];
  // Draw only the two end segments of each edge, leaving the middle open.
  const fraction = 0.15;
  const interpolate = (a,b,t) => a.map((v,i)=>v+(b[i]-v)*t);
  const addSegment = (a,b) => {
    x.push(a[0],b[0],null); y.push(a[1],b[1],null); z.push(a[2],b[2],null);
  };
  pts.forEach(([a,b]) => {
    addSegment(a,interpolate(a,b,fraction));
    addSegment(interpolate(a,b,1-fraction),b);
  });
  return { type:'scatter3d', mode:'lines', name, x, y, z, hoverinfo:'skip', showlegend:false, legendgroup:'volumes', line:{color, width:3} };
}
const volumeDefs = Object.keys(octants).sort((a,b)=>b.localeCompare(a)).map(bits => [bits,
  ...(bits[1] === '1' ? [5.5,10.5] : [0.5,5.5]),
  ...(bits[2] === '1' ? [5.5,10.5] : [0.5,5.5]),
  ...(bits[0] === '1' ? [0.5,1] : [0,0.5])
]);
const volumeTraces = [], edgeTraces = [];
volumeDefs.forEach(([bits, x0, x1, y0, y1, z0, z1]) => {
  const meta = octants[bits];
  // Inset only the displayed octants, not issue coordinates or classification.
  // Equal relative spacing on all axes (Independence has a 0–1 range).
  const inset = 0.015;
  x0 += 10 * inset; x1 -= 10 * inset;
  y0 += 10 * inset; y1 -= 10 * inset;
  z0 += inset; z1 -= inset;
  volumeTraces.push(cuboidMesh(`${meta.display} · ${meta.name} volume`, meta.color, 0.075, x0, x1, y0, y1, z0, z1));
  edgeTraces.push(cuboidEdges(`${meta.display} · ${meta.name} edges`, meta.edge, x0, x1, y0, y1, z0, z1));
});
const pointTraces = Object.entries(octants).sort(([a],[b])=>b.localeCompare(a)).map(([bits, meta]) => {
  const bucket = groups[bits] || [];
  return {
    type:'scatter3d', mode:'markers+text', name:`${meta.display} · ${meta.name}`,
    x: bucket.map(i => i.impact), y: bucket.map(i => i.ease), z: bucket.map(i => i.independent),
    text: bucket.map(i => i.id), textposition: 'top center',
    marker: {
      size: bucket.map(i => i.markerSize), color: bucket.map(i => i.color), symbol: bucket.map(i => i.symbol),
      line: { color:'#111827', width:2.2 }, opacity: 0.98
    },
    customdata: bucket.map(i => [escapeHtml(i.title), i.display, i.octant, i.bits, i.depends.join(', ') || '—', i.unlockCount, i.unlockPower, i.symbol === 'diamond' ? 'diamond = unlocks others' : 'circle = no downstream unlock']),
    hovertemplate:
      '<b>%{text}</b> · %{customdata[0]}<br>'+
      'Octant: %{customdata[1]} · %{customdata[2]} (%{customdata[3]})<br>'+
      'Impact: %{x}<br>Ease: %{y}<br>Independent: %{z}<br>'+
      'Depends on: %{customdata[4]}<br>'+
      'Unlocks: %{customdata[5]} issues · power %{customdata[6]}<br>'+
      'Marker: %{customdata[7]}<extra></extra>',
    showlegend:false
  };
});
const thresholdTraces = [
  {type:'surface', showscale:false, opacity:0.04, hoverinfo:'skip', showlegend:false, x:[[5.5,5.5],[5.5,5.5]], y:[[0.5,10.5],[0.5,10.5]], z:[[0,0],[1,1]], colorscale:[[0,'#94a3b8'],[1,'#94a3b8']]},
  {type:'surface', showscale:false, opacity:0.04, hoverinfo:'skip', showlegend:false, x:[[0.5,10.5],[0.5,10.5]], y:[[5.5,5.5],[5.5,5.5]], z:[[0,0],[1,1]], colorscale:[[0,'#94a3b8'],[1,'#94a3b8']]},
  {type:'surface', showscale:false, opacity:0.05, hoverinfo:'skip', showlegend:false, x:[[0.5,10.5],[0.5,10.5]], y:[[0.5,0.5],[10.5,10.5]], z:[[0.5,0.5],[0.5,0.5]], colorscale:[[0,'#cbd5e1'],[1,'#cbd5e1']]}
];
const allTraces = [...volumeTraces, ...edgeTraces, ...thresholdTraces, ...pointTraces];
const volumeIndices = Array.from({length: volumeTraces.length + edgeTraces.length + thresholdTraces.length}, (_, idx) => idx);
const visibleAll = Array(allTraces.length).fill(true);
const visiblePointsOnly = allTraces.map((_, idx) => !volumeIndices.includes(idx));
const layout = {
  margin: {l:0,r:0,t:0,b:0}, paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)',
  scene: {
    xaxis: {title:'Impact', range:[0.5,10.5], tick0:1, dtick:1, gridcolor:'#e2e8f0', zeroline:false, backgroundcolor:'#ffffff'},
    yaxis: {title:'Ease', range:[0.5,10.5], tick0:1, dtick:1, gridcolor:'#e2e8f0', zeroline:false, backgroundcolor:'#ffffff'},
    zaxis: {title:'Independence', range:[0,1], tickvals:[0,1], ticktext:['Dependent','Independent'], gridcolor:'#e2e8f0', zeroline:false, backgroundcolor:'#ffffff'},
    camera: {eye: {x:1.55, y:1.5, z:0.95}}, aspectmode:'cube'
  },
  updatemenus: [{
    type:'buttons', direction:'left', showactive:true, x:0.01, y:1.05, xanchor:'left', yanchor:'top',
    buttons: [
      {label:'Show octants', method:'update', args:[{visible: visibleAll}]},
      {label:'Hide octants', method:'update', args:[{visible: visiblePointsOnly}]},
      {label:'Reset view', method:'relayout', args:[{'scene.camera.eye': {x:1.55, y:1.5, z:0.95}}]}
    ]
  }]
};
return Plotly.newPlot('plot', allTraces, layout, {responsive:true, displaylogo:false});

}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function renderLegend() {
  document.getElementById('category-legend').innerHTML = Object.entries(octants).sort(([a],[b])=>b.localeCompare(a)).map(([bits,meta]) =>
    '<div class="legend-item"><span class="swatch" style="background:'+meta.color+';border-color:'+meta.edge+'"></span><div><strong>'+meta.element+' · '+meta.name+'</strong> <span class="small">('+bits+')</span><br><span class="small">'+meta.desc+'</span></div></div>'
  ).join('');
}
function renderTrigram(bits) {
  const meta=octants[bits];
  const fill=bits==='111'?'#FFFFFF':meta.color;
  const bar=(x,y,w)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="4" rx="1" fill="'+fill+'" stroke="'+meta.edge+'" stroke-width="0.9"/>';
  const bars=bits.split('').map((bit,i)=>bit==='1'?bar(1,1+i*7,25):bar(1,1+i*7,10)+bar(16,1+i*7,10)).join('');
  return '<svg width="27" height="20" viewBox="0 0 27 20" role="img" aria-label="Trigram '+bits+'" style="flex:none;vertical-align:middle">'+bars+'</svg>';
}
function renderTable(issues) {
  document.getElementById('issue-rows').innerHTML = [...issues].sort((a,b)=>b.bits.localeCompare(a.bits)).map(i =>
    '<tr><td><strong>'+escapeHtml(i.id)+'</strong></td><td>'+escapeHtml(i.title)+'<div class="small">depends on: '+escapeHtml(i.depends.join(', ')||'—')+'</div></td><td>'+i.element+' · '+i.octant+'<div class="small" style="display:flex;align-items:center;gap:6px;margin-top:4px">'+renderTrigram(i.bits)+i.bits+'</div></td><td>'+(i.independent?'yes':'no')+'</td><td>'+i.impact+'</td><td>'+i.ease+'</td><td>'+i.unlockCount+' <span class="small">(power '+i.unlockPower+')</span></td></tr>'
  ).join('');
}
async function fetchText(path) {
  const response=await fetch(path,{cache:'no-cache'});
  if(!response.ok) throw Error('Could not load '+path+' (HTTP '+response.status+').');
  return response.text();
}
async function main() {
  const status=document.getElementById('data-status');
  try {
    if(location.protocol==='file:') throw Error('Serve this directory over HTTP (for example, python -m http.server) or use GitHub Pages.');
    if(typeof Plotly==='undefined') throw Error('Plotly could not load. Check your Internet connection.');
    const [issueText,dependencyText]=await Promise.all([fetchText('data/issues.md'),fetchText('data/dependencies.md')]);
    const issues=classifyIssues(parseIssues(issueText),parseDependencies(dependencyText),octants);
    renderLegend(); renderTable(issues);
    await renderPlot(issues);
    status.textContent='Loaded '+issues.length+' issues from Markdown.';
  } catch(error) {
    status.textContent='Bagraph: '+error.message;
    status.setAttribute('role','alert');
  }
}
if(typeof document!=='undefined') main();
if(typeof module!=='undefined') module.exports={parseIssues,parseDependencies,classifyIssues,octants};
