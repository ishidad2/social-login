// next-auth.d.ts
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
    token_type?: string;
    id_token?: string;
    scope?: string;
    provider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
    token_type?: string;
    id_token?: string;
    scope?: string;
    provider?: string;
  }
}
