import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Save, MapPin, Shield, Activity, Loader2 } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      setSettings(data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load settings");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setSettings({
          ...settings,
          officeLocation: { lat: e.latlng.lat, lng: e.latlng.lng }
        });
      },
    });
    return null;
  }

  if (loading) return (
    <div className="flex items-center justify-center h-[80vh]">
      <Loader2 className="animate-spin text-primary-500" size={48} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Enterprise Settings</h1>
          <p className="text-slate-500 mt-2">Configure system-wide parameters and security boundaries.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-8"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Configuration
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Geofence Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card h-[600px] flex flex-col p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-primary-500" size={20} />
              <h3 className="font-bold text-slate-800">Perimeter Definition (Geo-Fence)</h3>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200">
              <MapContainer 
                center={[settings.officeLocation.lat, settings.officeLocation.lng]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[settings.officeLocation.lat, settings.officeLocation.lng]} />
                <Circle 
                  center={[settings.officeLocation.lat, settings.officeLocation.lng]} 
                  radius={settings.allowedRadius}
                  pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.2 }}
                />
                <MapClickHandler />
              </MapContainer>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">Click on the map to redefine the central office location.</p>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="card space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="text-primary-500" size={20} />
              <h3 className="font-bold text-slate-800">Security Parameters</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block flex justify-between">
                  Scanner Radius (meters)
                  <span className="text-primary-600 font-bold">{settings.allowedRadius}m</span>
                </label>
                <input 
                  type="range" 
                  min="10" 
                  max="5000" 
                  step="10"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  value={settings.allowedRadius}
                  onChange={(e) => setSettings({...settings, allowedRadius: parseInt(e.target.value)})}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600 mb-2 block flex justify-between">
                  AI Confidence Threshold
                  <span className="text-primary-600 font-bold">{Math.round(settings.aiThreshold * 100)}%</span>
                </label>
                <input 
                  type="range" 
                  min="0.4" 
                  max="0.9" 
                  step="0.05"
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  value={settings.aiThreshold}
                  onChange={(e) => setSettings({...settings, aiThreshold: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="card bg-slate-900 text-white space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="text-primary-400" size={20} />
              <h3 className="font-bold">Summary</h3>
            </div>
            <div className="space-y-2 text-sm opacity-80">
              <p>📍 Location: {settings.officeLocation.lat.toFixed(4)}, {settings.officeLocation.lng.toFixed(4)}</p>
              <p>📏 Area: {((Math.PI * Math.pow(settings.allowedRadius, 2)) / 1000000).toFixed(2)} km²</p>
              <p>🤖 AI Strictness: {settings.aiThreshold > 0.7 ? 'High' : 'Standard'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
