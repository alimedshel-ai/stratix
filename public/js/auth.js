// Shared auth utilities
function getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return null;
    }
    return token;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// Check auth on page load
if (!getToken()) {
    window.location.href = '/login';
}
