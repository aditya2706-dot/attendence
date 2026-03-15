import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  History, 
  Search, 
  Calendar, 
  Download, 
  FileSpreadsheet,
  Loader2,
  Filter
} from 'lucide-react';

function AttendanceHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: '',
    date: ''
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/attendance/logs', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      setLogs(data);
    } catch (error) {
      toast.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters.date]); // Refetch when date changes

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchLogs();
  };

  const exportToCSV = () => {
    if (logs.length === 0) return toast.error('No data to export');
    
    const headers = ['Name', 'Employee ID', 'Department', 'Date', 'Time', 'Confidence', 'Status'];
    const rows = logs.map(log => [
      log.name,
      log.employeeId,
      log.department,
      new Date(log.timestamp).toLocaleDateString(),
      new Date(log.timestamp).toLocaleTimeString(),
      `${(log.confidence * 100).toFixed(1)}%`,
      log.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully');
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Attendance History</h1>
          <p className="text-slate-500 mt-1">Review and manage past attendance records.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-900 transition-all active:scale-95 shadow-lg"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card md:col-span-2 flex items-center gap-4 px-6 h-16">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name and press Enter..." 
            className="flex-1 bg-transparent border-none outline-none text-slate-700"
            value={filters.name}
            onChange={(e) => setFilters({...filters, name: e.target.value})}
            onKeyDown={handleSearch}
          />
        </div>
        <div className="card flex items-center gap-4 px-6 h-16">
          <Calendar className="text-primary-500" size={20} />
          <input 
            type="date" 
            className="flex-1 bg-transparent border-none outline-none text-slate-700 font-medium"
            value={filters.date}
            onChange={(e) => setFilters({...filters, date: e.target.value})}
          />
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 italic">
                <th className="pb-4 font-semibold text-slate-400 text-sm uppercase px-4">Client</th>
                <th className="pb-4 font-semibold text-slate-400 text-sm uppercase px-4">ID</th>
                <th className="pb-4 font-semibold text-slate-400 text-sm uppercase px-4">Dept.</th>
                <th className="pb-4 font-semibold text-slate-400 text-sm uppercase px-4">Date</th>
                <th className="pb-4 font-semibold text-slate-400 text-sm uppercase px-4">Time</th>
                <th className="pb-4 font-semibold text-slate-400 text-sm uppercase px-4 text-center">Confidence</th>
                <th className="pb-4 font-semibold text-slate-400 text-sm uppercase px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <Loader2 className="animate-spin text-primary-500 mx-auto" size={32} />
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 px-4">
                      <div className="font-bold text-slate-700">{log.name}</div>
                    </td>
                    <td className="py-5 px-4 text-slate-500 font-medium">{log.employeeId}</td>
                    <td className="py-5 px-4 text-slate-500">{log.department}</td>
                    <td className="py-5 px-4 text-slate-600 font-medium">
                      {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-5 px-4 text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-5 px-4 text-center">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${log.confidence > 0.8 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                        {(log.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-slate-400">
                    <History size={40} className="mx-auto mb-3 opacity-20" />
                    <p>No records found for the selected filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AttendanceHistory;
