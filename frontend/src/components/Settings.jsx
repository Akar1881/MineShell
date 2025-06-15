import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Terminal, FolderOpen, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const { id } = useParams();
  const [settings, setSettings] = useState({
    motd: '',
    minRam: 1,
    maxRam: 2,
    maxPlayers: 20,
    whitelist: false,
    onlineMode: true,
    difficulty: 'easy',
    gamemode: 'survival',
    pvp: true
  });

  const [showMotdModal, setShowMotdModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [selectedFormat, setSelectedFormat] = useState('none');
  const [currentMotd, setCurrentMotd] = useState('');

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Dark Blue', value: '#0000AA' },
    { name: 'Dark Green', value: '#00AA00' },
    { name: 'Dark Aqua', value: '#00AAAA' },
    { name: 'Dark Red', value: '#AA0000' },
    { name: 'Dark Purple', value: '#AA00AA' },
    { name: 'Gold', value: '#FFAA00' },
    { name: 'Gray', value: '#AAAAAA' },
    { name: 'Dark Gray', value: '#555555' },
    { name: 'Blue', value: '#5555FF' },
    { name: 'Green', value: '#55FF55' },
    { name: 'Aqua', value: '#55FFFF' },
    { name: 'Red', value: '#FF5555' },
    { name: 'Light Purple', value: '#FF55FF' },
    { name: 'Yellow', value: '#FFFF55' },
    { name: 'White', value: '#FFFFFF' },
  ];

  const formats = [
    { name: 'None', value: 'none' },
    { name: 'Bold', value: 'bold' },
    { name: 'Italic', value: 'italic' },
    { name: 'Underline', value: 'underline' },
    { name: 'Strikethrough', value: 'strikethrough' },
  ];

  useEffect(() => {
    fetchSettings();
  }, [id]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`/api/servers/${id}/settings`);
      const data = response.data;
      // Convert RAM values from "1G" format to numbers
      setSettings({
        ...data,
        minRam: parseInt(data.minRam) || 1,
        maxRam: parseInt(data.maxRam) || 4
      });
      setCurrentMotd(data.motd);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Convert RAM values to proper format
      const settingsToSave = {
        ...settings,
        minRam: parseInt(settings.minRam),
        maxRam: parseInt(settings.maxRam)
      };
      await axios.put(`/api/servers/${id}/settings`, settingsToSave);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  const addMotdFormat = (type) => {
    let formatCode = '';
    switch (type) {
      case 'bold':
        formatCode = '§l';
        break;
      case 'italic':
        formatCode = '§o';
        break;
      case 'underline':
        formatCode = '§n';
        break;
      case 'strikethrough':
        formatCode = '§m';
        break;
      default:
        break;
    }
    setCurrentMotd(prev => prev + formatCode);
  };

  const addMotdColor = (color) => {
    const colorCode = color.replace('#', '');
    setCurrentMotd(prev => prev + `§${colorCode}`);
  };

  const handleMotdSave = () => {
    setSettings(prev => ({ ...prev, motd: currentMotd }));
    setShowMotdModal(false);
  };

  return (
    <div className="p-6">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center mb-4 sm:mb-0">
          <Link
            to={`/server/${id}`}
            className="btn btn-secondary mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-bold text-white">Server Settings</h2>
        </div>

        <div className="flex space-x-2">
          <Link
            to={`/server/${id}`}
            className="btn btn-secondary"
          >
            <Terminal className="w-5 h-5 mr-2" />
            Console
          </Link>
          <Link
            to={`/server/${id}?tab=files`}
            className="btn btn-secondary"
          >
            <FolderOpen className="w-5 h-5 mr-2" />
            Files
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MOTD Section */}
        <div className="card">
          <div className="p-4">
            <h3 className="text-lg font-medium text-white mb-4">Message of the Day (MOTD)</h3>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={settings.motd}
                  onChange={(e) => setSettings({ ...settings, motd: e.target.value })}
                  placeholder="Enter MOTD"
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setCurrentMotd(settings.motd);
                    setShowMotdModal(true);
                  }}
                >
                  Advanced
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RAM Settings */}
        <div className="card">
          <div className="p-4">
            <h3 className="text-lg font-medium text-white mb-4">Memory Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Minimum RAM (GB)
                </label>
                <input
                  type="number"
                  className="input w-full"
                  value={settings.minRam}
                  onChange={(e) => setSettings({ ...settings, minRam: parseInt(e.target.value) })}
                  min="1"
                  max="32"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Maximum RAM (GB)
                </label>
                <input
                  type="number"
                  className="input w-full"
                  value={settings.maxRam}
                  onChange={(e) => setSettings({ ...settings, maxRam: parseInt(e.target.value) })}
                  min="1"
                  max="32"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Player Settings */}
        <div className="card">
          <div className="p-4">
            <h3 className="text-lg font-medium text-white mb-4">Player Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-400 mb-2">
                  Maximum Players
                </label>
                <input
                  type="number"
                  className="input w-full"
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings({ ...settings, maxPlayers: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="whitelist"
                  className="checkbox"
                  checked={settings.whitelist}
                  onChange={(e) => setSettings({ ...settings, whitelist: e.target.checked })}
                />
                <label htmlFor="whitelist" className="ml-2 text-dark-400">
                  Enable Whitelist
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Server Mode */}
        <div className="card">
          <div className="p-4">
            <h3 className="text-lg font-medium text-white mb-4">Server Mode</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="onlineMode"
                className="checkbox"
                checked={settings.onlineMode}
                onChange={(e) => setSettings({ ...settings, onlineMode: e.target.checked })}
              />
              <label htmlFor="onlineMode" className="ml-2 text-dark-400">
                Online Mode
              </label>
            </div>
            <p className="text-sm text-dark-400 mt-2">
              When enabled, only authenticated players can join the server
            </p>
          </div>
        </div>

        {/* Game Settings */}
        <div className="card">
          <div className="p-4">
            <h3 className="text-lg font-medium text-white mb-4">Game Settings</h3>
            <div className="settings-group">
              <div className="setting-item">
                <label>Difficulty</label>
                <select 
                  value={settings.difficulty} 
                  onChange={(e) => setSettings({...settings, difficulty: e.target.value})}
                >
                  <option value="peaceful">Peaceful</option>
                  <option value="easy">Easy</option>
                  <option value="normal">Normal</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Game Mode</label>
                <select 
                  value={settings.gamemode} 
                  onChange={(e) => setSettings({...settings, gamemode: e.target.value})}
                >
                  <option value="survival">Survival</option>
                  <option value="creative">Creative</option>
                  <option value="adventure">Adventure</option>
                  <option value="spectator">Spectator</option>
                </select>
              </div>
              <div className="setting-item">
                <label>PvP</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="pvp"
                    checked={settings.pvp}
                    onChange={(e) => setSettings({...settings, pvp: e.target.checked})}
                  />
                  <label htmlFor="pvp"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button
          className="btn btn-primary w-full"
          onClick={handleSave}
        >
          Save Settings
        </button>
      </div>

      {/* MOTD Advanced Modal */}
      {showMotdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Advanced MOTD Editor</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-400 mb-2">
                Current MOTD
              </label>
              <input
                type="text"
                className="input w-full mb-2"
                value={currentMotd}
                onChange={(e) => setCurrentMotd(e.target.value)}
                placeholder="Enter MOTD"
              />
              <p className="text-sm text-dark-400">
                Preview: {currentMotd}
              </p>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-2">Colors</h4>
              <div className="grid grid-cols-8 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: color.value }}
                    onClick={() => addMotdColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-2">Formatting</h4>
              <div className="flex flex-wrap gap-2">
                {formats.map((format) => (
                  <button
                    key={format.name}
                    className="btn btn-secondary"
                    onClick={() => addMotdFormat(format.value)}
                  >
                    {format.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => setShowMotdModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleMotdSave}
              >
                Save MOTD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 