require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const documentsRoutes = require('./routes/documents');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/documents', documentsRoutes);

app.get('/', (req, res) => res.json({ ok: true, message: 'Gestion documental API' }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
