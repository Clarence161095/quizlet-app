const ejs = require('ejs');
const path = require('path');

module.exports = function setupViewHelpers(app) {
  // Helper function to render views with layout
  const originalRender = app.response.render;
  
  app.response.render = function(view, options, callback) {
    const self = this;
    options = options || {};
    
    // Render the view first
    ejs.renderFile(
      path.join(app.get('views'), view + '.ejs'),
      options,
      (err, html) => {
        if (err) return callback ? callback(err) : self.req.next(err);
        
        // Then render with layout
        options.body = html;
        originalRender.call(self, 'layout', options, callback);
      }
    );
  };
};
