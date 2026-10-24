const express = require('express');
const axios = require('axios');
let books = require('./booksdb.js');
let isValid = require('./auth_users.js').isValid;
let users = require('./auth_users.js').users;
const public_users = express.Router();

const BASE_URL = 'http://localhost:5000';

/* ------------------------------------------------------------------
   Internal data endpoints. The public routes below call these
   through Axios, so every book lookup is an Axios request.
------------------------------------------------------------------- */
public_users.get('/internal/books', (req, res) => {
  return res.status(200).json(books);
});

public_users.get('/internal/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  return book ? res.status(200).json(book) : res.status(404).json({ message: 'Book not found' });
});

public_users.get('/internal/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  return result.length
    ? res.status(200).json(result)
    : res.status(404).json({ message: 'No books found for this author' });
});

public_users.get('/internal/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  return result.length
    ? res.status(200).json(result)
    : res.status(404).json({ message: 'No books found for this title' });
});

/* ------------------------------------------------------------------
   Axios client functions (async/await and promise callbacks)
------------------------------------------------------------------- */

// Get all books (async/await)
const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/internal/books`);
  return response.data;
};

// Get a book by ISBN (promise callbacks)
const getBookByISBN = (isbn) =>
  axios.get(`${BASE_URL}/internal/isbn/${isbn}`).then((response) => response.data);

// Get books by author (async/await)
const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/internal/author/${encodeURIComponent(author)}`);
  return response.data;
};

// Get books by title (promise callbacks)
const getBooksByTitle = (title) =>
  axios
    .get(`${BASE_URL}/internal/title/${encodeURIComponent(title)}`)
    .then((response) => response.data);

// Send the upstream status/message back to the caller when a lookup fails
const sendError = (res, err) => {
  const status = err.response ? err.response.status : 500;
  const message = err.response ? err.response.data.message : 'Internal server error';
  return res.status(status).json({ message });
};

/* ----------------------------- Routes ---------------------------- */

// Register a new user
public_users.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: 'User already exists' });
  }
  users.push({ username, password });
  return res.status(200).json({ message: 'User successfully registered. Now you can login' });
});

// Get all books (Axios + async/await)
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await getAllBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (err) {
    return sendError(res, err);
  }
});

// Get book details by ISBN (Axios + async/await)
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const book = await getBookByISBN(req.params.isbn);
    return res.status(200).json(book);
  } catch (err) {
    return sendError(res, err);
  }
});

// Get book details by author (Axios + async/await)
public_users.get('/author/:author', async (req, res) => {
  try {
    const result = await getBooksByAuthor(req.params.author);
    return res.status(200).json({ booksbyauthor: result });
  } catch (err) {
    return sendError(res, err);
  }
});

// Get book details by title (Axios + async/await)
public_users.get('/title/:title', async (req, res) => {
  try {
    const result = await getBooksByTitle(req.params.title);
    return res.status(200).json({ booksbytitle: result });
  } catch (err) {
    return sendError(res, err);
  }
});

// Get reviews for a book
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found' });
  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;