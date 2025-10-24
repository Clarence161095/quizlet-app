import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const MFASetup = () => {
  const [step, setStep] = useState(1); // 1: Generate QR, 2: Verify
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, setupMFA, verifyMFASetup } = useAuth();
  const { flashError, flashSuccess } = useApp();
  const navigate = useNavigate();

  const handleGenerateQR = async () => {
    setLoading(true);
    
    const result = await setupMFA(user.id);
    
    if (result.success) {
      setSecret(result.secret);
      setQrCode(result.qrCode);
      setStep(2);
    } else {
      flashError(result.error);
    }
    
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await verifyMFASetup(user.id, secret, token);
    
    if (result.success) {
      flashSuccess('MFA enabled successfully!');
      navigate('/dashboard');
    } else {
      flashError(result.error);
      setToken('');
    }
    
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <i className="fas fa-shield-alt text-blue-600 text-5xl mb-4"></i>
          <h1 className="text-3xl font-bold text-gray-800">Setup MFA</h1>
          <p className="text-gray-600 mt-2">
            Add an extra layer of security to your account
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                <i className="fas fa-info-circle mr-2"></i>Before you begin
              </h3>
              <p className="text-sm text-blue-700">
                You'll need an authenticator app like Google Authenticator or Authy installed on your phone.
              </p>
            </div>

            <button
              onClick={handleGenerateQR}
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-qrcode mr-2"></i>Generate QR Code
                </>
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">
                Step 1: Scan this QR code
              </h3>
              <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Step 2: Enter the 6-digit code
              </h3>
              <input
                type="text"
                className="input text-center text-2xl tracking-widest"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                required
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading || token.length !== 6}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check mr-2"></i>Enable MFA
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MFASetup;
