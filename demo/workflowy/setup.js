

var NotableMind = require('./index.jsx')
  , base = document.getElementById('example')

React.renderComponent(NotableMind({
  backs: {
    local: {
      title: 'Just this computer',
      shortname: 'Local',
      description: 'Everything stored in your browser, not sent to any servers.',
      icon: 'computer',
      cls: require('./lib/local-pl')
    },
    dropbox: {
      title: 'Dropbox',
      shortname: 'Dropbox',
      description: 'Sync with your dropbox account',
      icon: 'dropbox',
      cls: require('./dropbox-pl'),
      options: {
        APP_KEY: 'd6frc2jgc64eqqp'
      }
    }
  }
}), base)


