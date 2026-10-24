const express = require('express');
const axios = require('axios');
let books = require('./booksdb.js');
let isValid = require('./auth_users.js').isValid;
let users = require('./auth_users.js').users;
const public_users = express.Router();

const BASE_URL = 'http://localhost:5000';

/* ------------------------------------------------------------------
   Data helpers: each returns a Promise, so routes can use async/await
------------------------------------------------------------------- */
const fetchAllBooks = () => new Promise((resolve) => resolve(books));

const fetchBookByISBN = (isbn) =>
  new Promise((resolve, reject) => {
    books[isbn] ? resolve(books[isbn]) : reject(new Error('Book not found'));
  });

const fetchBooksBy = (field, value) =>
  new Promise((resolve, reject) => {
    const matches = Object.keys(books)
      .filter((isbn) => books[isbn][field].toLowerCase() === value.toLowerCase())
      .map((isbn) => ({ isbn, ...books[isbn] }));
    matches.length ? resolve(matches) : reject(new Error(`No books found for ${field} "${value}"`));
  });

/* ----------------------------- Routes ---------------------------- */

// Task 7: register a new user
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

// Task 2: all books
public_users.get('/', async (req, res) => {
  const allBooks = await fetchAllBooks();
  return res.status(200).send(JSON.stringify(allBooks, null, 4));
});

// Task 3: by ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const book = await fetchBookByISBN(req.params.isbn);
    return res.status(200).json(book);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// Task 4: by author
public_users.get('/author/:author', async (req, res) => {
  try {
    const result = await fetchBooksBy('author', req.params.author);
    return res.status(200).json({ booksbyauthor: result });
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// Task 5: by title
public_users.get('/title/:title', async (req, res) => {
  try {
    const result = await fetchBooksBy('title', req.params.title);
    return res.status(200).json({ booksbytitle: result });
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// Task 6: reviews for a book
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found' });
  return res.status(200).json(book.reviews);
});

/* ------------------------------------------------------------------
   Task 11: Axios clients (async/await and promise callbacks).
   Run the server, then: node router/general.js
------------------------------------------------------------------- */
const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

const getBookByISBN = (isbn) =>
  axios.get(`${BASE_URL}/isbn/${isbn}`).then((response) => response.data);

const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

const getBooksByTitle = (title) =>
  axios
    .get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => response.data);

if (require.main === module) {
  (async () => {
    try {
      console.log('All books:', await getAllBooks());
      console.log('ISBN 1:', await getBookByISBN(1));
      console.log('Author:', await getBooksByAuthor('Chinua Achebe'));
      console.log('Title:', await getBooksByTitle('Things Fall Apart'));
    } catch (err) {
      console.error('Request failed:', err.message);
    }
  })();
}

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
