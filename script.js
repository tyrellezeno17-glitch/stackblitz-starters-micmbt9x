<span id="admin-badge" class="admin-badge" style="display: none;">Admin</span>
const API_URL = 'https://community-resource-api-8no4.onrender.com/api/resources';
const AUTH_URL = 'https://community-resource-api-8no4.onrender.com/api';

const resourceList = document.getElementById('resource-list');
const categoryFilter = document.getElementById('category-filter');
const resourceForm = document.getElementById('resource-form');
const formMessage = document.getElementById('form-message');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('auth-message');
const loggedOutView = document.getElementById('logged-out-view');
const loggedInView = document.getElementById('logged-in-view');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const addResourceSection = document.getElementById('add-resource-section');

function getToken() {
  return localStorage.getItem('token');
}

function userIsAdmin() {
  return localStorage.getItem('isAdmin') === 'true';
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  localStorage.removeItem('isAdmin');
}

function updateAuthUI() {
  const token = getToken();
  const email = localStorage.getItem('email');
  const isAdmin = userIsAdmin();

  if (token) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'block';
    userEmailSpan.textContent = email || '';

    if (isAdmin) {
      addResourceSection.style.display = 'block';
      adminBadge.style.display = 'inline-block';
    } else {
      addResourceSection.style.display = 'none';
      adminBadge.style.display = 'none';
    }
  } else {
    loggedOutView.style.display = 'block';
    loggedInView.style.display = 'none';
    addResourceSection.style.display = 'none';
    userEmailSpan.textContent = '';
    adminBadge.style.display = 'none';
    resourceList.innerHTML = '<p class="empty-state">Please log in or sign up to view resources.</p>';
  }
}

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const response = await fetch(`${AUTH_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('email', data.email);
    localStorage.setItem('isAdmin', String(data.isAdmin));

    authMessage.textContent = '';
    signupForm.reset();

    updateAuthUI();
    loadResources();
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('email', data.email);
    localStorage.setItem('isAdmin', String(data.isAdmin));

    authMessage.textContent = '';
    loginForm.reset();

    updateAuthUI();
    loadResources();
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

logoutBtn.addEventListener('click', () => {
  clearSession();
  updateAuthUI();
});

async function loadResources(category = '') {
  const token = getToken();

  if (!token) {
    resourceList.innerHTML = '<p>Please log in or sign up to view resources.</p>';
    return;
  }

  resourceList.innerHTML = '<p>Loading resources...</p>';

  try {
    const url = category
      ? `${API_URL}?category=${encodeURIComponent(category)}`
      : API_URL;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      clearSession();
      updateAuthUI();
      resourceList.innerHTML = '<p>Your session expired. Please log in again.</p>';
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || 'Error loading resources');
    }

    const resources = data;

    if (resources.length === 0) {
      resourceList.innerHTML = '<p>No resources found.</p>';
      return;
    }

    resourceList.innerHTML = '';

    resources.forEach((resource) => {
      const card = document.createElement('div');
      card.className = 'resource-card';

      card.innerHTML = `
        <span class="category-tag">${resource.category}</span>
        <h3>${resource.name}</h3>
        <p><strong>Address:</strong> ${resource.address}</p>
        ${resource.phone ? `<p><strong>Phone:</strong> ${resource.phone}</p>` : ''}
        ${resource.hours ? `<p><strong>Hours:</strong> ${resource.hours}</p>` : ''}
        ${resource.notes ? `<p><strong>Notes:</strong> ${resource.notes}</p>` : ''}
        ${
          userIsAdmin()
            ? `<button class="delete-btn" data-id="${resource._id}">Delete</button>`
            : ''
        }
      `;

      resourceList.appendChild(card);
    });

    if (userIsAdmin()) {
      attachDeleteHandlers();
    }
  } catch (err) {
    resourceList.innerHTML =
      '<p>Error loading resources. The server may be waking up — try again in a moment.</p>';
    console.error(err);
  }
}

function attachDeleteHandlers() {
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const token = getToken();

      const confirmDelete = confirm('Are you sure you want to delete this resource?');

      if (!confirmDelete) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.status === 401) {
          clearSession();
          updateAuthUI();
          alert('Your session expired. Please log in again.');
          return;
        }

        if (response.status === 403) {
          alert('Only the admin can delete resources.');
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete resource');
        }

        loadResources(categoryFilter.value);
      } catch (err) {
        alert('Error deleting resource. Please try again.');
        console.error(err);
      }
    });
  });
}

categoryFilter.addEventListener('change', () => {
  loadResources(categoryFilter.value);
});

resourceForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = getToken();

  if (!token) {
    formMessage.textContent = 'Please log in first.';
    return;
  }

  if (!userIsAdmin()) {
    formMessage.textContent = 'Only the admin can add resources.';
    return;
  }

  formMessage.textContent = 'Submitting...';

  const newResource = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    address: document.getElementById('address').value,
    phone: document.getElementById('phone').value,
    hours: document.getElementById('hours').value,
    notes: document.getElementById('notes').value
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newResource)
    });

    const data = await response.json();

    if (response.status === 401) {
      formMessage.textContent = 'Your session expired. Please log in again.';
      clearSession();
      updateAuthUI();
      return;
    }

    if (response.status === 403) {
      formMessage.textContent = 'Only the admin can add resources.';
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add resource');
    }

    formMessage.textContent = 'Resource added!';
    resourceForm.reset();
    loadResources(categoryFilter.value);
  } catch (err) {
    formMessage.textContent = 'Error adding resource. Please try again.';
    console.error(err);
  }
});

updateAuthUI();

if (getToken()) {
  loadResources();
}