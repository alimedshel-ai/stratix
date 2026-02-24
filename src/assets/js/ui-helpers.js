/**
 * Stratix UI Helpers
 * Common UI functions for loading states, error handling, and notifications
 */

// =====================================
// Loading States
// =====================================

/**
 * Show loading overlay
 */
function showLoading(message = 'جارِ التحميل...') {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    const text = overlay.querySelector('p');
    if (text) text.textContent = message;
  }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * Show inline loading spinner
 */
function showInlineLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="loading-spinner mx-auto mb-3"></div>
        <p class="text-muted">جارِ التحميل...</p>
      </div>
    `;
  }
}

// =====================================
// Error Handling
// =====================================

/**
 * Show error message
 */
function showError(message, containerId = null) {
  const errorHTML = `
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = errorHTML;
    }
  } else {
    // Show at top of page
    const topContainer = document.querySelector('.container-fluid, .container');
    if (topContainer) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = errorHTML;
      topContainer.insertBefore(tempDiv.firstElementChild, topContainer.firstChild);
    }
  }
}

/**
 * Show success message
 */
function showSuccess(message, containerId = null) {
  const successHTML = `
    <div class="alert alert-success alert-dismissible fade show" role="alert">
      <i class="bi bi-check-circle-fill me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  if (containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = successHTML;
    }
  } else {
    const topContainer = document.querySelector('.container-fluid, .container');
    if (topContainer) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = successHTML;
      topContainer.insertBefore(tempDiv.firstElementChild, topContainer.firstChild);

      // Auto-hide after 3 seconds
      setTimeout(() => {
        const alert = tempDiv.firstElementChild;
        if (alert) {
          alert.classList.remove('show');
          setTimeout(() => alert.remove(), 150);
        }
      }, 3000);
    }
  }
}

/**
 * Show empty state
 */
function showEmptyState(message, icon = 'inbox', containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-${icon} empty-state-icon"></i>
        <p class="empty-state-text">${message}</p>
      </div>
    `;
  }
}

// =====================================
// Toast Notifications
// =====================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
  // Create toast container if not exists
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  const toastId = 'toast_' + Date.now();
  const icons = {
    success: 'check-circle-fill',
    error: 'exclamation-triangle-fill',
    warning: 'exclamation-circle-fill',
    info: 'info-circle-fill'
  };

  const colors = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'info'
  };

  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-white bg-${colors[type]} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-${icons[type]} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHTML);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: duration
  });

  toast.show();

  // Remove from DOM after hidden
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

// =====================================
// API Helpers
// =====================================

/**
 * Make authenticated API request
 */
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login';
    throw new Error('No authentication token');
  }

  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  // Handle unauthorized
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'خطأ في الاتصال بالخادم' }));
    throw new Error(error.message || 'حدث خطأ');
  }

  return response.json();
}

/**
 * Handle API errors gracefully
 */
function handleApiError(error, containerId = null) {
  console.error('API Error:', error);

  const message = error.message || 'حدث خطأ غير متوقع';

  if (containerId) {
    showError(message, containerId);
  } else {
    showToast(message, 'error');
  }
}

// =====================================
// Form Helpers
// =====================================

/**
 * Validate form
 */
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return false;
  }

  return true;
}

/**
 * Get form data as object
 */
function getFormData(formId) {
  const form = document.getElementById(formId);
  if (!form) return {};

  const formData = new FormData(form);
  const data = {};

  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }

  return data;
}

/**
 * Reset form
 */
function resetForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
    form.classList.remove('was-validated');
  }
}

// =====================================
// Modal Helpers
// =====================================

/**
 * Show confirmation modal
 */
function showConfirmModal(title, message, onConfirm, onCancel = null) {
  const modalId = 'confirmModal_' + Date.now();

  const modalHTML = `
    <div class="modal fade" id="${modalId}" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${message}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
            <button type="button" class="btn btn-primary" id="${modalId}_confirm">تأكيد</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  const modalElement = document.getElementById(modalId);
  const modal = new bootstrap.Modal(modalElement);

  document.getElementById(`${modalId}_confirm`).addEventListener('click', () => {
    modal.hide();
    if (onConfirm) onConfirm();
  });

  modalElement.addEventListener('hidden.bs.modal', () => {
    if (onCancel) onCancel();
    modalElement.remove();
  });

  modal.show();
}

// =====================================
// Table Helpers
// =====================================

/**
 * Render table with data
 */
function renderTable(containerId, columns, data, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!Array.isArray(data) || data.length === 0) {
    showEmptyState(options.emptyMessage || 'لا توجد بيانات', options.emptyIcon || 'inbox', containerId);
    return;
  }

  let tableHTML = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
            ${options.actions ? '<th>الإجراءات</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${data.map((row, index) => `
            <tr>
              ${columns.map(col => `
                <td>${col.render ? col.render(row[col.key], row, index) : row[col.key] || '-'}</td>
              `).join('')}
              ${options.actions ? `<td>${options.actions(row, index)}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHTML;
}

// =====================================
// Utilities
// =====================================

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format number
 */
function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('ar-SA');
}

/**
 * Debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// =====================================
// Authentication
// =====================================

/**
 * Check if user is authenticated
 */
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    window.location.href = '/login';
    return false;
  }

  return true;
}

/**
 * Get current user
 */
function getCurrentUser() {
  const user = localStorage.getItem('user');
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch (e) {
    return null;
  }
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Export for use in modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showLoading,
    hideLoading,
    showInlineLoading,
    showError,
    showSuccess,
    showEmptyState,
    showToast,
    apiRequest,
    handleApiError,
    validateForm,
    getFormData,
    resetForm,
    showConfirmModal,
    renderTable,
    formatDate,
    formatNumber,
    debounce,
    checkAuth,
    getCurrentUser,
    logout
  };
}
