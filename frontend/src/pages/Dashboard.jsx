import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserCheck, 
  Clock, 
  ArrowUpRight,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [statsRes, weeklyRes] = await Promise.all([
          axios.get('/api/dashboard/stats', config),
          axios.get('/api/dashboard/weekly-stats', config)
        ]);

        setStats(statsRes.data);
        setWeeklyData(weeklyRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-100px)]">
      <Loader2 className="animate-spin text-primary-500" size={40} />
    </div>
  );

  const statCards = [
    { title: 'Total Registered Clients', value: stats?.totalClients || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: "Today's Attendance", value: stats?.todayAttendance || 0, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'System Status', value: 'Active', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Enterprise Overview</h1>
        <p className="text-slate-500 mt-1 font-medium">Real-time biometric analytics & system health.</p>
      </header>

      {/* Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card group hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 border border-slate-100 hover:border-primary-100"
          >
            <div className="flex justify-between items-start">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                <stat.icon size={28} />
              </div>
              <div className="bg-slate-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="text-slate-400" size={20} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-slate-500 font-semibold text-xs uppercase tracking-wider">{stat.title}</p>
              <h2 className="text-4xl font-black text-slate-800 mt-1">{stat.value}</h2>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Attendance Trends</h3>
              <p className="text-slate-500 text-sm">Last 7 days activity</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold">
              <TrendingUp size={14} />
              <span>+12.5% vs Prev week</span>
            </div>
          </div>
          
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return date.toLocaleDateString([], { weekday: 'short' });
                  }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Mini-list */}
        <div className="card">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {stats?.recentLogs.length > 0 ? (
              stats.recentLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                    {log.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{log.name}</p>
                    <p className="text-xs text-slate-500">{log.department}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-slate-700">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-emerald-500">Present</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-10">No logs today</p>
            )}
          </div>
          <button className="w-full mt-8 py-3 bg-slate-50 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
