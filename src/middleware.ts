import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('pos_session')?.value;
  
  if (!sessionCookie) {
    // Jika tidak ada session (belum login), biarkan ke halaman '/' saja.
    if (request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  try {
    const session = JSON.parse(sessionCookie);
    
    // KASIR (Karyawan) TIDAK BOLEH AKSES SELAIN POS & SHIFT
    if (session.role === 'KASIR') {
      const allowedPaths = ['/pos', '/shift'];
      
      // Jika mencoba akses path lain (misal /stock, /retur, /employees, dll) 
      // termasuk ke Dashboard (/), LEMPAR kembali ke /pos!
      if (!allowedPaths.includes(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL('/pos', request.url));
      }
    }
  } catch (e) {
    if (request.nextUrl.pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Konfigurasi path mana saja yang dicegat middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
