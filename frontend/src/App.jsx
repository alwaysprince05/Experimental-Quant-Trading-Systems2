import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Server, LayoutDashboard, ShieldAlert, Cpu } from 'lucide-react';
import './App.css';

function App() {
  const [allData, setAllData] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    latency: '0',
    ordersPerSec: 0,
    filled: 0,
    pnl: 0,
  });
  
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const currentIndex = useRef(0);
  const dataWindow = 80;

  useEffect(() => {
    axios.get('/api/bots/stat-arb/simulate?num_days=2000')
      .then(response => {
        const data = response.data.data;
        setAllData(data);
        setLiveData(data.slice(0, dataWindow));
        currentIndex.current = dataWindow;
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (allData.length === 0) return;

    const interval = setInterval(() => {
      if (currentIndex.current >= allData.length) {
        currentIndex.current = dataWindow;
      }

      const nextPoint = allData[currentIndex.current];
      
      setLiveData(prev => {
        const next = [...prev.slice(1), nextPoint];
        return next;
      });

      setMetrics(prev => ({
        latency: (Math.random() * 0.5 + 0.2).toFixed(1),
        ordersPerSec: Math.floor(Math.random() * 500 + 1200),
        filled: prev.filled + Math.floor(Math.random() * 5),
        pnl: prev.pnl + (nextPoint.position !== 0 ? (Math.random() * 15 - 5) : 0) 
      }));

      const basePrice = nextPoint.asset_A || 100;
      // Generate exactly 10 rows to fit the design safely
      const asks = Array.from({length: 10}).map((_, i) => ({
        price: (basePrice + (i * 0.01) + 0.01).toFixed(2),
        size: (Math.random() * 400 + 50).toFixed(0)
      })).sort((a,b) => b.price - a.price);
      
      const bids = Array.from({length: 10}).map((_, i) => ({
        price: (basePrice - (i * 0.01) - 0.01).toFixed(2),
        size: (Math.random() * 400 + 50).toFixed(0)
      })).sort((a,b) => b.price - a.price);

      setOrderBook({ bids, asks });
      currentIndex.current++;
    }, 60);

    return () => clearInterval(interval);
  }, [allData]);

  if (loading) {
    return (
      <div className="loader-overlay">
        <Cpu className="loader-icon" size={48} />
        <div className="loader-text">INITIALIZING NEURAL QUANT ENGINE</div>
      </div>
    );
  }

  const latest = liveData[liveData.length - 1] || {};
  const spreadValue = latest.spread ? latest.spread.toFixed(4) : '0.0000';
  const zScoreValue = latest.z_score ? latest.z_score.toFixed(3) : '0.000';
  
  // Premium glassmorphism tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-tooltip">
          {payload.map((entry, index) => (
            <div key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="ai-dashboard">
      
      {/* HEADER */}
      <header className="glass-header">
        <div className="brand">
          <Activity size={20} className="text-cyan" />
          <span className="fw-bold">NEXUS</span>
          <span className="fw-light">QUANT</span>
        </div>
        <div className="header-stats mono">
          <div className="stat-pill">
            <span className="text-dim">SYS_LATENCY:</span> <span className="text-white">{metrics.latency}ms</span>
          </div>
          <div className="stat-pill">
            <span className="text-dim">THROUGHPUT:</span> <span className="text-white">{metrics.ordersPerSec} req/s</span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="layout-grid">
        
        {/* LEFT COLUMN: Order Book & Metrics */}
        <div className="layout-col gap-16">
          
          <div className="glass-panel metric-card">
            <div className="metric-title text-dim">SESSION PNL (USDT)</div>
            <div className={`metric-huge mono ${metrics.pnl >= 0 ? 'text-green glow-green' : 'text-red glow-red'}`}>
              {metrics.pnl >= 0 ? '+' : ''}${metrics.pnl.toFixed(2)}
            </div>
          </div>

          <div className="glass-panel flex-fill">
            <div className="panel-title">
              <LayoutDashboard size={14} /> MARKET DEPTH
            </div>
            <div className="panel-body">
              <div className="order-book">
                <div className="ob-header text-dim">
                  <span>PRICE</span><span>SIZE</span>
                </div>
                
                <div className="ob-asks">
                  {orderBook.asks.map((ask, i) => (
                    <div key={i} className="ob-row">
                      <span className="text-red">{ask.price}</span>
                      <span className="text-white">{ask.size}</span>
                      <div className="ob-bg bg-red" style={{width: `${(ask.size/500)*100}%`}}></div>
                    </div>
                  ))}
                </div>
                
                <div className="ob-spread mono fw-bold">
                  {spreadValue} <span className="text-dim" style={{fontSize: '10px'}}>SPREAD</span>
                </div>
                
                <div className="ob-bids">
                  {orderBook.bids.map((bid, i) => (
                    <div key={i} className="ob-row">
                      <span className="text-green">{bid.price}</span>
                      <span className="text-white">{bid.size}</span>
                      <div className="ob-bg bg-green" style={{width: `${(bid.size/500)*100}%`}}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* MIDDLE COLUMN: Charts */}
        <div className="layout-col gap-16 flex-double">
          
          <div className="glass-panel flex-fill">
            <div className="panel-title">
              <Activity size={14} /> DYNAMIC PAIR CORRELATION
            </div>
            <div className="panel-body chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="asset_A" stroke="#00f2fe" strokeWidth={2} fillOpacity={1} fill="url(#colorA)" isAnimationActive={false} name="Asset A" />
                  <Area type="monotone" dataKey="asset_B" stroke="#8A2BE2" strokeWidth={2} fillOpacity={1} fill="url(#colorB)" isAnimationActive={false} name="Asset B" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel flex-fill">
            <div className="panel-title">
              <Activity size={14} /> STAT-ARB Z-SCORE OSCILLATOR
            </div>
            <div className="panel-body chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liveData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorZ" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <YAxis domain={[-4, 4]} stroke="rgba(255,255,255,0.3)" tick={{fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace'}} axisLine={false} tickLine={false}/>
                  <ReferenceLine y={2} stroke="#ff3366" strokeDasharray="3 3" strokeOpacity={0.8} />
                  <ReferenceLine y={-2} stroke="#00ff88" strokeDasharray="3 3" strokeOpacity={0.8} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                  <Area type="step" dataKey="z_score" stroke="#00ff88" strokeWidth={2} fillOpacity={1} fill="url(#colorZ)" isAnimationActive={false} />
                  <Line type="step" dataKey="position" stroke="#ffaa00" strokeWidth={2} dot={false} isAnimationActive={false} strokeOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI Signals & Logs */}
        <div className="layout-col gap-16">
          
          <div className="glass-panel" style={{height: '140px'}}>
            <div className="panel-title">
              <Cpu size={14} /> ALGO SIGNALS
            </div>
            <div className="panel-body" style={{justifyContent: 'center', display: 'flex', flexDirection: 'column'}}>
              <div className="metric-row">
                <span className="text-dim">Z-SCORE SIGNAL</span>
                <span className={`mono fw-bold ${Math.abs(latest.z_score) > 2 ? 'text-red glow-red' : 'text-cyan'}`}>{zScoreValue}</span>
              </div>
              <div className="metric-row" style={{marginTop: '12px'}}>
                <span className="text-dim">ALGO STATUS</span>
                <span className={`mono fw-bold ${latest.position > 0 ? 'text-green' : latest.position < 0 ? 'text-red' : 'text-white'}`}>
                  {latest.position > 0 ? 'LONG SPREAD' : latest.position < 0 ? 'SHORT SPREAD' : 'SEARCHING...'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel flex-fill">
            <div className="panel-title">
              <ShieldAlert size={14} /> NEURAL EXECUTION LOG
            </div>
            <div className="panel-body">
              <div className="exec-feed">
                {liveData.slice(-14).map((d, i) => {
                  if (d.position !== 0 && (i === 0 || liveData[liveData.length - 15 + i]?.position !== d.position)) {
                     return (
                       <div key={i} className="exec-row highlight-bg">
                         <span className="text-dim mono">{new Date().toISOString().split('T')[1].slice(0,8)}</span>
                         <span className={`fw-bold mono ${d.position > 0 ? 'text-green' : 'text-red'}`}>{d.position > 0 ? 'BUY' : 'SELL'}</span>
                         <span className="text-white mono">SPREAD @ Z={d.z_score?.toFixed(2)}</span>
                       </div>
                     )
                  }
                  return (
                    <div key={i} className="exec-row">
                      <span className="text-dim mono">{new Date().toISOString().split('T')[1].slice(0,8)}</span>
                      <span className="text-dim mono">TICK A:{d.asset_A?.toFixed(1)} B:{d.asset_B?.toFixed(1)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default App;
