import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que usuários JÁ autenticados não devem acessar
const PUBLIC_ONLY_ROUTES = ['/', '/login', '/register'];

// Rotas que exigem autenticação
const PROTECTED_PREFIXES = ['/home', '/choose-games', '/choose-interests', '/menu'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Autenticado tentando acessar página pública → vai para home (elimina o flash)
  if (token && PUBLIC_ONLY_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Não autenticado tentando acessar rota protegida → vai para login
  if (!token && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/home/:path*',
    '/choose-games',
    '/choose-interests',
    '/menu/:path*',
  ],
};
