import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MyShares() {
  const { flashSuccess, flashError } = useApp();
  const [activeTab, setActiveTab] = useState('sent'); // 'sent' or 'received'
  const [sentShares, setSentShares] = useState([]);
  const [receivedShares, setReceivedShares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        api.get('/api/shares/sent'),
        api.get('/api/shares/received')
      ]);
      setSentShares(sentRes.data);
      setReceivedShares(receivedRes.data);
    } catch (error) {
      console.error('Failed to fetch shares:', error);
      flashError('Failed to load shares. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptShare = async (shareId) => {
    try {
      await api.post(`/api/shares/${shareId}/accept`);
      flashSuccess('Share accepted successfully!');
      fetchShares(); // Refresh
    } catch (error) {
      console.error('Failed to accept share:', error);
      flashError(error.response?.data?.error || 'Failed to accept share.');
    }
  };

  const handleRevokeShare = async (shareId) => {
    if (!confirm('Revoke this share? The recipient will lose access.')) return;

    try {
      await api.delete(`/api/shares/${shareId}`);
      flashSuccess('Share revoked successfully!');
      fetchShares(); // Refresh
    } catch (error) {
      console.error('Failed to revoke share:', error);
      flashError('Failed to revoke share. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const shares = activeTab === 'sent' ? sentShares : receivedShares;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        <i className="fas fa-share-alt text-green-600"></i> My Shares
      </h1>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sent')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sent'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="fas fa-paper-plane"></i> Sent ({sentShares.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="fas fa-inbox"></i> Received ({receivedShares.length})
          </button>
        </nav>
      </div>

      {/* Shares List */}
      {shares.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <i className="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-600">
            {activeTab === 'sent' 
              ? "You haven't shared anything yet."
              : "No shares received yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shares.map((share) => (
            <div key={share.id} className="bg-white p-6 rounded-lg shadow border border-gray-200 hover:border-blue-300 transition">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    <i className={`fas ${share.share_type === 'set' ? 'fa-layer-group' : 'fa-folder'} text-blue-600`}></i>{' '}
                    {share.entity_name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      {activeTab === 'sent' ? (
                        <>
                          <i className="fas fa-user"></i> Shared with: <strong>{share.recipient_username}</strong>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user"></i> From: <strong>{share.owner_username}</strong>
                        </>
                      )}
                    </p>
                    <p>
                      <i className="fas fa-clock"></i> {new Date(share.created_at).toLocaleDateString()}
                    </p>
                    <p>
                      <i className={`fas ${share.share_status === 'pending' ? 'fa-hourglass-half' : 'fa-check-circle'}`}></i>{' '}
                      Status: <strong className={share.share_status === 'pending' ? 'text-yellow-600' : 'text-green-600'}>
                        {share.share_status}
                      </strong>
                    </p>
                    {share.allow_export !== undefined && (
                      <p>
                        <i className={`fas ${share.allow_export ? 'fa-unlock' : 'fa-lock'}`}></i>{' '}
                        Export: {share.allow_export ? 'Allowed' : 'Not Allowed'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  {activeTab === 'received' && share.share_status === 'pending' && (
                    <button
                      onClick={() => handleAcceptShare(share.id)}
                      className="flex-1 sm:flex-initial bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm whitespace-nowrap"
                    >
                      <i className="fas fa-check"></i> Accept
                    </button>
                  )}
                  {activeTab === 'received' && share.share_status === 'accepted' && share.clone_id && (
                    <Link
                      to={`/${share.share_type}s/${share.clone_id}`}
                      className="flex-1 sm:flex-initial text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                    >
                      <i className="fas fa-eye"></i> View
                    </Link>
                  )}
                  {activeTab === 'sent' && (
                    <button
                      onClick={() => handleRevokeShare(share.id)}
                      className="flex-1 sm:flex-initial bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm whitespace-nowrap"
                    >
                      <i className="fas fa-times"></i> Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
