import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PriceChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card h-80 flex items-center justify-center text-slate-400">
        <p>No price data available.</p>
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div className="glass-card p-5 h-80 flex flex-col justify-center items-center text-center">
        <h3 className="text-3xl font-bold text-white mb-2">${Number(data[0].price).toFixed(2)}</h3>
        <p className="text-slate-400">Initial price recorded. Waiting for next scrape to draw chart.</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    fullDate: new Date(item.recorded_at).toLocaleString(),
    price: Number(item.price)
  })).reverse(); // Oldest to newest usually better for charts if not already sorted

  // Calculate trend
  const currentPrice = chartData[chartData.length - 1]?.price || 0;
  const previousPrice = chartData[chartData.length - 2]?.price || currentPrice;
  const priceDiff = currentPrice - previousPrice;
  const percentChange = previousPrice !== 0 ? ((priceDiff) / previousPrice * 100).toFixed(2) : 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800/90 backdrop-blur-md border border-glass-border p-3 rounded-lg shadow-xl">
          <p className="text-slate-300 text-xs mb-1">{payload[0].payload.fullDate}</p>
          <p className="text-brand-400 font-bold text-lg">${payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Current Price</p>
          <h3 className="text-3xl font-bold text-white">${currentPrice.toFixed(2)}</h3>
        </div>
        {chartData.length > 1 && (
          <div className={`flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
            priceDiff < 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
            priceDiff > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
          }`}>
            {priceDiff < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : 
             priceDiff > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : 
             <Minus className="w-4 h-4 mr-1" />}
            {Math.abs(percentChange)}%
          </div>
        )}
      </div>

      <div className="w-full h-[350px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{fill: '#94a3b8', fontSize: 12}} 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              width={80}
              tick={{fill: '#94a3b8', fontSize: 12}} 
              tickFormatter={(value) => `$${value}`}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
