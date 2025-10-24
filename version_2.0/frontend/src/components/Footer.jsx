import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">
              © {new Date().getFullYear()} Qi Learning App. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              About
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Help
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
