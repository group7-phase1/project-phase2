"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsername = exports.checkAuthentication = exports.setAuthenticationState = void 0;
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
exports.setAuthenticationState = setAuthenticationState;
// Function to check if a user is authenticated
function checkAuthentication() {
    return globalState.isAuthenticated;
}
exports.checkAuthentication = checkAuthentication;
// Function to get the username
function getUsername() {
    return globalState.username;
}
exports.getUsername = getUsername;
module.exports = {
    setAuthenticationState: setAuthenticationState,
    checkAuthentication: checkAuthentication,
    getUsername: getUsername,
};
