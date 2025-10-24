import { useFlash } from '../../contexts/FlashContext';

const FlashMessages = () => {
  const { messages, removeMessage } = useFlash();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-circle';
      case 'info':
        return 'fa-info-circle';
      default:
        return 'fa-info-circle';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'info':
        return 'bg-blue-100 border-blue-500 text-blue-700';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {Object.entries(messages).map(([type, msgArray]) =>
        msgArray.map((msg) => (
          <div
            key={msg.id}
            className={`border-l-4 p-4 rounded shadow-lg ${getColor(type)} animate-slide-in`}
          >
            <div className="flex items-start">
              <i className={`fas ${getIcon(type)} mt-1 mr-3`}></i>
              <div className="flex-1">
                <p>{msg.message}</p>
              </div>
              <button
                onClick={() => removeMessage(type, msg.id)}
                className="ml-3 text-gray-600 hover:text-gray-800"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FlashMessages;
