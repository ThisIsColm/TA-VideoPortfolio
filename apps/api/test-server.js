const express = require('express');
const app = express();
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.listen(3001, () => console.log('Minimal server running on http://localhost:3001'));
