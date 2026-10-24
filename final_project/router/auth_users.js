const express = require('express');
const jwt = require('jsonwebtoken');
let books = require('./booksdb.js');
const regd_users = express.Router();

let users = [];

// True if the username is not taken yet
const isValid = (username) => !users.some((user) => user.username === username);

// True if username and password match a registered user
const authenticatedUser = (username, password) =>
  users.some((user) => user.username === username && user.password === password);

// Task 8: login as a registered user
regd_users.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid login. Check username and password' });
  }
  const accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({ message: 'User successfully logged in' });
});

// Task 9: add or modify a review (review text is sent as a query parameter)
regd_users.put('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (!books[isbn]) return res.status(404).json({ message: 'Book not found' });
  if (!review) return res.status(400).json({ message: 'Review text is required (?review=...)' });

  const existed = books[isbn].reviews[username] !== undefined;
  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: existed
      ? `Review for ISBN ${isbn} updated`
      : `Review for ISBN ${isbn} added`,
    reviews: books[isbn].reviews,
  });
});

// Task 10: delete the logged-in user's review only
regd_users.delete('/auth/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) return res.status(404).json({ message: 'Book not found' });
  if (books[isbn].reviews[username] === undefined) {
    return res.status(404).json({ message: 'You have no review for this book' });
  }
  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Review for ISBN ${isbn} deleted`,
    reviews: books[isbn].reviews,
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
