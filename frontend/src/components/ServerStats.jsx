import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Server, Clock, HardDrive, Cpu, Globe } from 'lucide-react';

const ServerStats = ({ serverId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/servers/${serverId}/stats`);
        if (response.data.success) {
          setStats(response.data.stats);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching server stats:', error);
        setError('Failed to load server statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Poll for stats every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    
    return () => clearInterval(interval);
  }, [serverId]);

  // Format uptime from seconds to human-readable format
  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  };

  if ((loading && !stats) || !stats) {
    return (
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <div className="text-center py-4 text-dark-400">
          Loading server statistics...
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-dark-800 rounded-lg p-4 mb-4">
        <div className="text-center py-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-medium text-white mb-3">Server Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div className="bg-dark-700 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <Server className="w-5 h-5 text-primary-400 mr-2" />
            <span className="text-dark-300 text-sm">Status</span>
          </div>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              stats.status === 'running' ? 'bg-green-400' : 
              stats.status === 'stopping' ? 'bg-yellow-400' : 'bg-red-400'
            }`}></div>
            <span className="text-white font-medium capitalize">{stats.status}</span>
          </div>
        </div>
        
        {/* Connection */}
        <div className="bg-dark-700 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <Globe className="w-5 h-5 text-primary-400 mr-2" />
            <span className="text-dark-300 text-sm">Connection</span>
          </div>
          <div className="text-white font-medium">
            {stats.ip}:{stats.port}
          </div>
          <div className="text-dark-400 text-xs mt-1">
            {stats.edition} Edition
          </div>
        </div>
        
        {/* Uptime */}
        <div className="bg-dark-700 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-primary-400 mr-2" />
            <span className="text-dark-300 text-sm">Uptime</span>
          </div>
          <div className="text-white font-medium">
            {formatUptime(stats.uptime)}
          </div>
          <div className="text-dark-400 text-xs mt-1">
            {stats.status === 'running' ? 'Server is online' : 'Server is offline'}
          </div>
        </div>
        
        {/* Memory Usage */}
        <div className="bg-dark-700 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <HardDrive className="w-5 h-5 text-primary-400 mr-2" />
            <span className="text-dark-300 text-sm">Memory</span>
          </div>
          {stats.memory.used !== null ? (
            <>
              <div className="text-white font-medium">
                {stats.memory.used} MB / {stats.memory.total} MB
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    stats.memory.percentage > 80 ? 'bg-red-400' : 
                    stats.memory.percentage > 60 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${stats.memory.percentage}%` }}
                ></div>
              </div>
            </>
          ) : (
            <div className="text-dark-400">
              Not available
            </div>
          )}
        </div>
        
        {/* CPU Usage */}
        <div className="bg-dark-700 rounded-lg p-3">
          <div className="flex items-center mb-2">
            <Cpu className="w-5 h-5 text-primary-400 mr-2" />
            <span className="text-dark-300 text-sm">CPU Usage</span>
          </div>
          {stats.cpu.usage !== null ? (
            <>
              <div className="text-white font-medium">
                {stats.cpu.usage}%
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    stats.cpu.usage > 80 ? 'bg-red-400' : 
                    stats.cpu.usage > 60 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${stats.cpu.usage}%` }}
                ></div>
              </div>
            </>
          ) : (
            <div className="text-dark-400">
              Not available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServerStats;