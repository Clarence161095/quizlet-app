import React from 'react';
import { useApp } from '../contexts/AppContext';

const FlashMessage = () => {
  const { flashMessages, removeFlash } = useApp();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle"></i>;
      case 'error':
        return <i className="fas fa-exclamation-circle"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-triangle"></i>;
      case 'info':
        return <i className="fas fa-info-circle"></i>;
      default:
        return null;
    }
  };

  const getColorClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  if (flashMessages.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {flashMessages.map((flash) => (
        <div
          key={flash.id}
          className={`flash-message border-l-4 p-4 rounded-lg shadow-lg ${getColorClasses(flash.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3 text-lg">
              {getIcon(flash.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{flash.message}</p>
            </div>
            <button
              onClick={() => removeFlash(flash.id)}
              className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlashMessage;
