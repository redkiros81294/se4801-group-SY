// Module-level holder so the Axios interceptor can read the current token
// without depending on React context. AuthContext updates this on login/logout.
let accessToken: string | null = null;

const ACCESS_TOKEN_KEY = 'chaintrack_access_token';

// Initialize from sessionStorage if available so the token survives page reloads
// until AuthContext finishes its silent refresh flow.
if (typeof window !== 'undefined') {
  accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }
};

export const getAccessToken = () => accessToken;
