const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'data', 'books.json');
const viewsDirectory = path.join(__dirname, 'views');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readBooks() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeBooks(books) {
  fs.writeFileSync(dataFile, JSON.stringify(books, null, 2));
}

function validateBook(book) {
  if (!book || typeof book.title !== 'string' || !book.title.trim()) {
    return 'Title is required.';
  }
  if (typeof book.author !== 'string' || !book.author.trim()) {
    return 'Author is required.';
  }
  if (typeof book.category !== 'string' || !book.category.trim()) {
    return 'Category is required.';
  }
  return null;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(viewsDirectory, 'index.html'));
});

app.get('/books', (req, res) => {
  res.redirect('/');
});

app.get('/books/:id', (req, res) => {
  res.sendFile(path.join(viewsDirectory, 'books.html'));
});

app.get('/api/books', (req, res) => {
  res.json(readBooks());
});

app.get('/api/books/:id', (req, res) => {
  const book = readBooks().find((item) => item.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found.' });
  }
  res.json(book);
});

app.post('/api/books', (req, res) => {
  const validationError = validateBook(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const book = {
    id: randomUUID(),
    title: req.body.title.trim(),
    author: req.body.author.trim(),
    category: req.body.category.trim()
  };
  const books = readBooks();
  books.push(book);
  writeBooks(books);
  res.status(201).json(book);
});

app.put('/api/books/:id', (req, res) => {
  const validationError = validateBook(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const books = readBooks();
  const bookIndex = books.findIndex((item) => item.id === req.params.id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  books[bookIndex] = {
    ...books[bookIndex],
    title: req.body.title.trim(),
    author: req.body.author.trim(),
    category: req.body.category.trim()
  };
  writeBooks(books);
  res.json(books[bookIndex]);
});

app.delete('/api/books/:id', (req, res) => {
  const books = readBooks();
  const bookIndex = books.findIndex((item) => item.id === req.params.id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  books.splice(bookIndex, 1);
  writeBooks(books);
  res.status(204).end();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.listen(PORT, () => {
  console.log(`Library Management System is running at http://localhost:${PORT}`);
});
