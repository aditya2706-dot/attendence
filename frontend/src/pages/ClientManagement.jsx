import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search, 
  Trash2, 
  UserCircle2,
  Building,
  Contact,
  Loader2
} from 'lucide-react';

function ClientManagement() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClients = async () => {
    try {
      const { data } = await axios.get('/api/clients', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClients(data);
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this client?')) {
      try {
        await axios.delete(`/api/clients/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success('Client removed');
        fetchClients();
      } catch (error) {
        toast.error('Delete failed');
      }
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Client Management</h1>
          <p className="text-slate-500 mt-1">Manage all registered individuals in the system.</p>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 px-4 w-96">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="bg-transparent border-none outline-none w-full py-2 text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary-500" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client._id} className="card group hover:border-primary-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                  <UserCircle2 size={40} />
                </div>
                <button 
                  onClick={() => handleDelete(client._id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <h3 className="text-lg font-bold text-slate-800">{client.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Contact size={16} className="text-slate-400" />
                    <span>ID: <span className="text-slate-700 font-medium">{client.employeeId}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Building size={16} className="text-slate-400" />
                    <span>Dept: <span className="text-slate-700 font-medium">{client.department}</span></span>
                  </div>
                </div>
                <div className="pt-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {client.faceDescriptors.length} Biometric Embeddings
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full py-20 text-center card bg-slate-50 border-dashed border-2">
               <Users className="mx-auto text-slate-300 mb-4" size={48} />
               <p className="text-slate-500 font-medium">No clients found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClientManagement;
