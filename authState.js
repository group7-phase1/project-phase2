// Initial state
var globalState = {
    isAuthenticated: false,
    username: '',
};
// Function to set authentication state
function setAuthenticationState(isAuthenticated, username) {
    globalState.isAuthenticated = isAuthenticated;
    globalState.username = username;
}
// Function to check if a user is authenticated
function checkAuthentication() {
    return globalState.isAuthenticated;
}
// Function to get the username
function getUsername() {
    return globalState.username;
}
module.exports = {
    setAuthenticationState: setAuthenticationState,
    checkAuthentication: checkAuthentication,
    getUsername: getUsername,
};
