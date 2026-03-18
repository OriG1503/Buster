const express = require('express');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3001;
const FILES_DIR = path.join(__dirname, 'files');

fs.mkdirSync(FILES_DIR, { recursive: true });

const app = express();

app.post('/upload', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  const filename = req.query.filename;
  if (!filename) {
    return res.status(400).json({ error: 'filename query param is required' });
  }
  const filePath = path.join(FILES_DIR, filename);
  fs.writeFile(filePath, req.body, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to save file' });
    }
    res.json({ filename, path: filePath });
  });
});

app.use('/files', express.static(FILES_DIR));

app.listen(PORT, () => {
  console.log(`Files server running on http://localhost:${PORT}`);
});
