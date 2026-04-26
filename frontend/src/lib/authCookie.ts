// Gerencia o cookie de autenticação usado pelo Next.js Middleware
// para redirecionar antes do primeiro render (sem flash).
// O localStorage continua sendo a fonte primária no lado do cliente.

const COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 dias (igual ao JWT)

export function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
