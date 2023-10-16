// Initial state
let globalState = {
    isAuthenticated: false,
    username: '',
};

// Function to set authentication state
export function setAuthenticationState(isAuthenticated, username) {
    globalState.isAuthenticated = isAuthenticated;
    globalState.username = username;
}

// Function to check if a user is authenticated
export function checkAuthentication() {
    return globalState.isAuthenticated;
}

// Function to get the username
export function getUsername() {
    return globalState.username;
}

module.exports = {
    setAuthenticationState,
    checkAuthentication,
    getUsername,
};
