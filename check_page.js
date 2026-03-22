const http = require('http');

http.get('http://localhost:3001/ceo-dashboard.html', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Page size:", data.length);
  });
});
