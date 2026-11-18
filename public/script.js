const statusMessage = document.getElementById('status');
const bookForm = document.getElementById('book-form');

function showStatus(message, isError) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', Boolean(isError));
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || `Request failed (${response.status}).`);
  }
  return response.status === 204 ? null : response.json();
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

async function loadBooks() {
  const list = document.getElementById('book-list');
  try {
    const books = await request('/api/books');
    list.replaceChildren();
    if (books.length === 0) {
      list.textContent = 'No books yet. Add the first one using the form.';
      return;
    }

    books.forEach((book) => {
      const card = document.createElement('a');
      card.className = 'book-card';
      card.href = `/books/${encodeURIComponent(book.id)}`;
      const title = document.createElement('strong');
      title.textContent = book.title;
      const author = document.createElement('span');
      author.textContent = `by ${book.author}`;
      card.append(title, author);
      list.append(card);
    });
  } catch (error) {
    showStatus(error.message, true);
  }
}

async function addBook(event) {
  event.preventDefault();
  try {
    await request('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formValues(bookForm))
    });
    bookForm.reset();
    showStatus('Book added successfully.');
    await loadBooks();
  } catch (error) {
    showStatus(error.message, true);
  }
}

async function loadBookDetail() {
  const id = decodeURIComponent(window.location.pathname.split('/').pop());
  const detail = document.getElementById('book-detail');
  const editForm = document.getElementById('book-form');
  const actions = document.getElementById('book-actions');
  let book;

  try {
    book = await request(`/api/books/${encodeURIComponent(id)}`);
    document.title = `${book.title} | Library Management System`;
    detail.replaceChildren();

    [['Book ID', book.id], ['Book title', book.title], ['Author', book.author],
      ['Category', book.category]].forEach(([label, value]) => {
      const row = document.createElement('p');
      const heading = document.createElement('strong');
      heading.textContent = `${label}: `;
      row.append(heading, document.createTextNode(value));
      detail.append(row);
    });

    Object.entries(book).forEach(([key, value]) => {
      if (editForm.elements.namedItem(key)) {
        editForm.elements.namedItem(key).value = value || '';
      }
    });
    actions.classList.remove('hidden');
  } catch (error) {
    detail.textContent = '';
    showStatus(error.message, true);
    return;
  }

  document.getElementById('edit-book').addEventListener('click', () => {
    detail.classList.add('hidden');
    actions.classList.add('hidden');
    editForm.classList.remove('hidden');
  });
  document.getElementById('cancel-edit').addEventListener('click', () => {
    editForm.classList.add('hidden');
    detail.classList.remove('hidden');
    actions.classList.remove('hidden');
  });
  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await request(`/api/books/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues(editForm))
      });
      window.location.reload();
    } catch (error) {
      showStatus(error.message, true);
    }
  });
  document.getElementById('delete-book').addEventListener('click', async () => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    try {
      await request(`/api/books/${encodeURIComponent(id)}`, { method: 'DELETE' });
      window.location.assign('/');
    } catch (error) {
      showStatus(error.message, true);
    }
  });
}

if (bookForm) {
  bookForm.addEventListener('submit', (event) => {
    if (window.location.pathname === '/') addBook(event);
  });
}

if (document.getElementById('book-list')) {
  loadBooks();
}
if (document.getElementById('book-detail')) {
  loadBookDetail();
}
