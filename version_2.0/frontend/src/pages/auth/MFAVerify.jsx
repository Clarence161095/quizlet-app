import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const MFAVerify = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { verifyMFA, mfaTempData } = useAuth();
  const { flashError } = useApp();
  const navigate = useNavigate();

  // Redirect if no MFA session
  React.useEffect(() => {
    if (!mfaTempData) {
      navigate('/login');
    }
  }, [mfaTempData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await verifyMFA(token);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      flashError(result.error);
      setToken('');
    }
    
    setLoading(false);
  };

  if (!mfaTempData) return null;

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <i className="fas fa-shield-alt text-blue-600 text-5xl mb-4"></i>
          <h1 className="text-3xl font-bold text-gray-800">Two-Factor Authentication</h1>
          <p className="text-gray-600 mt-2">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <i className="fas fa-key mr-2"></i>Verification Code
            </label>
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

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading || token.length !== 6}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>Verifying...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-2"></i>Verify
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            <i className="fas fa-arrow-left mr-2"></i>Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFAVerify;
