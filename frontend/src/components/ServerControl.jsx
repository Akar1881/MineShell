import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ServerControl = ({ server, onStatusChange }) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showKillConfirm, setShowKillConfirm] = useState(false);

  const handleStart = async () => {
    try {
      setIsStarting(true);
      const response = await axios.post(`/api/servers/${server.id}/start`);
      if (response.data.success) {
        toast.success('Server starting...');
        // Status will be updated by the parent component
      }
    } catch (error) {
      console.error('Error starting server:', error);
      const errorMessage = error.response?.data?.message || 'Failed to start server';
      toast.error(errorMessage);
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsStopping(true);
      const response = await axios.post(`/api/servers/${server.id}/stop`);
      if (response.data.success) {
        // Status will be updated by Console component
        toast.info(response.data.message || 'Server stopping...');
        if (response.data.note) {
          toast.info(response.data.note, { duration: 5000 });
        }
      }
    } catch (error) {
      console.error('Error stopping server:', error);
      // Display the specific error message from the server if available
      const errorMessage = error.response?.data?.message || 'Failed to stop server';
      toast.error(errorMessage);
      
      // If the server is already stopping, don't reset the isStopping state
      if (error.response?.data?.message !== 'Server is already in the process of stopping') {
        setIsStopping(false);
      }
    }
  };

  const handleKill = async () => {
    try {
      const response = await axios.post(`/api/servers/${server.id}/stop?force=true`);
      if (response.data.success) {
        onStatusChange('stopped');
        toast.success('Server force stopped');
      }
    } catch (error) {
      console.error('Error force stopping server:', error);
      const errorMessage = error.response?.data?.message || 'Failed to force stop server';
      toast.error(errorMessage);
    } finally {
      setIsStopping(false);
      setShowKillConfirm(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {server.status === 'running' ? (
        <button
          onClick={handleStop}
          className="btn btn-danger"
          disabled={isStopping}
        >
          {isStopping ? 'Stopping...' : 'Stop'}
        </button>
      ) : server.status === 'stopping' ? (
        <>
          <button
            onClick={() => setShowKillConfirm(true)}
            className="btn btn-danger"
            disabled={showKillConfirm}
          >
            Force Stop
          </button>

          {showKillConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-dark-700 p-6 rounded-lg w-96">
                <h3 className="text-lg font-medium text-white mb-4">Force Stop Server</h3>
                <p className="text-dark-400 mb-4">
                  Are you sure you want to force stop the server? This will skip saving worlds and may cause data loss.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleKill}
                    className="btn btn-danger flex-1"
                  >
                    Yes, Force Stop
                  </button>
                  <button
                    onClick={() => setShowKillConfirm(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={handleStart}
          className="btn btn-primary"
          disabled={isStarting}
        >
          {isStarting ? 'Starting...' : 'Start'}
        </button>
      )}
    </div>
  );
};

export default ServerControl;