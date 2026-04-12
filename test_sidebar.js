const fs = require('fs');

global.localStorage = { getItem: () => null, setItem: () => {} };

const sidebarEl = { innerHTML: '', classList: { add: ()=>{}, remove: ()=>{} }, querySelectorAll: () => [] };
global.HTMLElement = Object; // mock
sidebarEl.__proto__ = Object.create(HTMLElement.prototype);

global.document = {
  readyState: 'complete',
  documentElement: {},
  getElementById: (id) => id === 'stx-sidebar' ? sidebarEl : null,
  addEventListener: () => {},
  querySelector: () => sidebarEl,
  querySelectorAll: () => [],
  head: { appendChild: () => {} },
  createElement: () => ({ innerHTML: '' })
};
global.window = {
  location: { pathname: '/ceo-dashboard.html' },
  api: {
    getCurrentUser: async () => ({
      role: 'OWNER',
      userType: 'COMPANY_MANAGER',
      entity: { id: 'test_entity', patternKey: 'default' }
    })
  }
};
global.getComputedStyle = () => ({ getPropertyValue: () => '#0a0a0a' });

const sidebarCode = fs.readFileSync('src/js/sidebar.js', 'utf8');
const cleanCode = sidebarCode.split('// ════════ الـ Bootstrapper')[0];
eval(cleanCode);

(async () => {
  await initSidebar();
  console.log("HTML length:", sidebarEl.innerHTML.length);
})();
