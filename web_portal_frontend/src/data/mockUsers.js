//
// src/data/mockUsers.js
// Centralized mock login credentials for the demo portal.
// Any future changes to mock users should be made here.
//
// Schema:
// - mockAdminUser: { username: string, password: string }

export const mockAdminUser = {
  username: 'admin',
  password: 'secret@123',
};

// PUBLIC_INTERFACE
export function isValidMockCredential(username, password) {
  /** Simple validator for the single mock admin user. */
  return username === mockAdminUser.username && password === mockAdminUser.password;
}
