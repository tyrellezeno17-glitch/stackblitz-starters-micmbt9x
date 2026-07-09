const API_URL =
  'https://community-resource-api-8no4.onrender.com/api/resources';

const resourceList = document.getElementById('resource-list');
const categoryFilter = document.getElementById('category-filter');
const resourceForm = document.getElementById('resource-form');
const formMessage = document.getElementById('form-message');

async function loadResources(category = '') {
  resourceList.innerHTML = '<p>Loading resources...</p>';
  try {
    const url = category
      ? `${API_URL}?category=${encodeURIComponent(category)}`
      : API_URL;
    const response = await fetch(url);
    const resources = await response.json();

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
        ${
          resource.phone
            ? `<p><strong>Phone:</strong> ${resource.phone}</p>`
            : ''
        }
        ${
          resource.hours
            ? `<p><strong>Hours:</strong> ${resource.hours}</p>`
            : ''
        }
        ${
          resource.notes
            ? `<p><strong>Notes:</strong> ${resource.notes}</p>`
            : ''
        }
        <button class="delete-btn" data-id="${resource._id}">Delete</button>
      `;
      resourceList.appendChild(card);
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        loadResources(categoryFilter.value);
      });
    });
  } catch (err) {
    resourceList.innerHTML =
      '<p>Error loading resources. The server may be waking up — try again in a moment.</p>';
    console.error(err);
  }
}

categoryFilter.addEventListener('change', () => {
  loadResources(categoryFilter.value);
});

resourceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.textContent = 'Submitting...';

  const newResource = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    address: document.getElementById('address').value,
    phone: document.getElementById('phone').value,
    hours: document.getElementById('hours').value,
    notes: document.getElementById('notes').value,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newResource),
    });

    if (!response.ok) throw new Error('Failed to add resource');

    formMessage.textContent = 'Resource added!';
    resourceForm.reset();
    loadResources(categoryFilter.value);
  } catch (err) {
    formMessage.textContent = 'Error adding resource. Please try again.';
    console.error(err);
  }
});

loadResources();
