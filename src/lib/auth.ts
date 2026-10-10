// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import { prisma } from "@/lib/prisma";
// import bcrypt from "bcryptjs";
// import { Role } from "@prisma/client";

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   session: {
//     strategy: "jwt",
//     maxAge: 24 * 60 * 60, // 24 hours
//   },
//   pages: {
//     signIn: "/login",
//     error: "/login",
//   },
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.role = user.role;
//         token.phone = user.phone;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (token) {
//         session.user.id = token.id as string;
//         session.user.role = token.role as Role;
//         session.user.phone = token.phone as string;
//       }
//       return session;
//     },
//   },
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error("Email and password are required");
//         }

//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email as string },
//         });

//         if (!user) {
//           throw new Error("No account found with this email");
//         }

//         if (!user.isActive) {
//           throw new Error("Your account has been deactivated");
//         }

//         const isPasswordValid = await bcrypt.compare(
//           credentials.password as string,
//           user.password
//         );

//         if (!isPasswordValid) {
//           throw new Error("Incorrect password");
//         }

//         return {
//           id: user.id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//           phone: user.phone,
//         };
//       },
//     }),
//   ],
// });


import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Employee Code", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Credentials are required");
        }

        const identifier = credentials.identifier as string;
        const password = credentials.password as string;

        let user = null;

        // Check if identifier looks like an employee code (starts with EMP)
        if (identifier.toUpperCase().startsWith("EMP")) {
          const agent = await prisma.agent.findUnique({
            where: { employeeCode: identifier.toUpperCase() },
            include: { user: true },
          });
          if (agent) user = agent.user;
        } else {
          // Login by email for admin and customer
          user = await prisma.user.findUnique({
            where: { email: identifier },
          });
        }

        if (!user) {
          throw new Error("No account found with these credentials");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        };
      },
    }),
  ],
});