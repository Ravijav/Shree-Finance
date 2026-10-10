import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  // If not logged in and trying to access protected routes
  if (!session) {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/agent") ||
      pathname.startsWith("/customer")
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // If logged in, redirect away from login page
  if (session && pathname === "/login") {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (role === "AGENT") return NextResponse.redirect(new URL("/agent/dashboard", req.url));
    // if (role === "CUSTOMER") return NextResponse.redirect(new URL("/customer/dashboard", req.url));
  }

  // Role-based route protection
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/agent") && role !== "AGENT") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
  //   return NextResponse.redirect(new URL("/login", req.url));
  // }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/agent/:path*",
    // "/customer/:path*",
    "/login",
  ],
};


// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { getToken } from "next-auth/jwt";

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;
  
//   // Read the token securely without loading Prisma
//   const token = await getToken({ 
//     req, 
//     secret: process.env.AUTH_SECRET // Use AUTH_SECRET for NextAuth v5
//   });
  
//   const role = token?.role;

//   // If not logged in and trying to access protected routes
//   if (!token) {
//     if (
//       pathname.startsWith("/admin") ||
//       pathname.startsWith("/agent") ||
//       pathname.startsWith("/customer")
//     ) {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//   }

//   // If logged in, redirect away from login page based on role
//   if (token && pathname === "/login") {
//     if (role === "ADMIN") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
//     if (role === "AGENT") return NextResponse.redirect(new URL("/agent/dashboard", req.url));
//     if (role === "CUSTOMER") return NextResponse.redirect(new URL("/customer/dashboard", req.url));
//   }

//   // Role-based route protection
//   if (pathname.startsWith("/admin") && role !== "ADMIN") {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }

//   if (pathname.startsWith("/agent") && role !== "AGENT") {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }

//   if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }

//   return NextResponse.next();
// }

// // export const config = {
// //   matcher: [
// //     "/admin/:path*",
// //     "/agent/:path*",
// //     "/customer/:path*",
// //     "/login",
// //   ],
// // };

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      * - login (the login page itself)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
//   ],
// };

// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { getToken } from "next-auth/jwt";

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   const token = await getToken({
//     req,
//     secret: process.env.NEXTAUTH_SECRET,
//   });

//   const role = token?.role as string | undefined;

//   // If not logged in and trying to access protected routes
//   if (!token) {
//     if (
//       pathname.startsWith("/admin") ||
//       pathname.startsWith("/agent") ||
//       pathname.startsWith("/customer")
//     ) {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//   }

//   // If logged in redirect away from login page
//   if (token && pathname === "/login") {
//     if (role === "ADMIN")
//       return NextResponse.redirect(new URL("/admin/dashboard", req.url));
//     if (role === "AGENT")
//       return NextResponse.redirect(new URL("/agent/dashboard", req.url));
//     if (role === "CUSTOMER")
//       return NextResponse.redirect(new URL("/customer/dashboard", req.url));
//   }

//   // Role based route protection
//   if (pathname.startsWith("/admin") && role !== "ADMIN") {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }
//   if (pathname.startsWith("/agent") && role !== "AGENT") {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }
//   if (pathname.startsWith("/customer") && role !== "CUSTOMER") {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/admin/:path*",
//     "/agent/:path*",
//     "/customer/:path*",
//     "/login",
//   ],
// };


// ////production code 

// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { getToken } from "next-auth/jwt";

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   // 👇 ADD THIS TO FIX THE VERCEL COOKIE ISSUE
//   const token = await getToken({
//     req,
//     secret: process.env.NEXTAUTH_SECRET,
//     secureCookie: process.env.NODE_ENV === "production",
//     cookieName: process.env.NODE_ENV === "production" 
//       ? "__Secure-authjs.session-token" 
//       : "authjs.session-token",
//   });

//   const role = token?.role as string | undefined;

//   // If not logged in and trying to access protected routes
//   if (!token) {
//     if (
//       pathname.startsWith("/admin") ||
//       pathname.startsWith("/agent") ||
//       pathname.startsWith("/customer")
//     ) {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//   }

//   // If logged in redirect away from login page
//   if (token && pathname === "/login") {
//     if (role === "ADMIN")
//       return NextResponse.redirect(new URL("/admin/dashboard", req.url));
//     if (role === "AGENT")
//       return NextResponse.redirect(new URL("/agent/dashboard", req.url));

//   }

//   // Role based route protection
//   if (pathname.startsWith("/admin") && role !== "ADMIN") {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }
//   if (pathname.startsWith("/agent") && role !== "AGENT") {
//     return NextResponse.redirect(new URL("/login", req.url));
//   }
//  

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     "/admin/:path*",
//     "/agent/:path*",
//     "/login",
//   ],
// };