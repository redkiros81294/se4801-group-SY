// Module-level holder so the Axios interceptor can read the current token
// without depending on React context. AuthContext updates this on login/logout.
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;
