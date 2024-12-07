import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import BoxProvider from 'next-auth/providers/box';
import DropboxProvider from 'next-auth/providers/dropbox';
import type { BaseClient } from "openid-client";
// @ts-ignore
import type { TokenEndpointHandler, UserinfoEndpointHandler } from "next-auth/providers";

type DropboxClient = BaseClient & {
  redirect_uris: string[];
}
const handler = NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive",
        },
      }
		}),
		AzureADProvider({
			clientId: process.env.AZURE_AD_CLIENT_ID!,
			clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
			tenantId: process.env.AZURE_AD_TENANT_ID,
			authorization: {
        params: {
          scope:
            "Files.Read.All Files.ReadWrite Files.ReadWrite.All Sites.Read.All Sites.ReadWrite.All User.Read openid email profile",
        },
      },
		}),
    // https://github.com/nextauthjs/next-auth/discussions/9777
    BoxProvider({
      clientId: process.env.BOX_CLIENT_ID,
      clientSecret: process.env.BOX_CLIENT_SECRET,
      authorization: {
        params: { scope: undefined },
      },
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      userinfo: {
        url: "https://api.box.com/2.0/users/me",
        async request({ tokens, provider }) {
          return await fetch("https://api.box.com/2.0/users/me", {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          }).then(async (res) => await res.json());
        },
      },
    }),
    // https://github.com/nextauthjs/next-auth/issues/8098
    DropboxProvider({
      clientId: process.env.DROPBOX_CLIENT_ID,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET,
      authorization:{
        params: {
          scope:
            "account_info.read files.content.read files.metadata.read",
          },
      },
      token: {
        url: "https://api.dropboxapi.com/oauth2/token",
        async request(context) {
          const client: DropboxClient = context.client as DropboxClient;
          const token = context.provider.token as Required<TokenEndpointHandler>
          const res = await fetch(token.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              code: context.params.code as string,
              grant_type: "authorization_code",
              code_verifier: context.checks.code_verifier as string,
              client_id: context.provider.clientId as string,
              client_secret: context.provider.clientSecret as string,
              redirect_uri: client.redirect_uris[0],
            }),
          });
          return {
            tokens: await res.json()
          };
        }
      },
      userinfo: {
        url: "https://api.dropboxapi.com/2/users/get_current_account",
        async request({provider, tokens}) {
          const userinfo = provider.userinfo as Required<UserinfoEndpointHandler>;
          const res = await fetch(userinfo.url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${tokens.access_token}`,
            }
          });
          return await res.json();
        }
      },
    })
	],
	callbacks: {
    async jwt({ token, account }) {
      // 初回サインイン時にアクセストークンをトークンに保存
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expiry_date = account.expires_at;
        token.token_type = account.token_type;
        token.id_token = account.id_token;
				token.scope = account.scope;
				token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // セッションにアクセストークンを含める
      session.access_token = token.access_token;
      session.refresh_token = token.refresh_token;
      session.expiry_date = token.expiry_date;
      session.token_type = token.token_type;
      session.id_token = token.id_token;
			session.scope = token.scope;
			session.provider = token.provider;
      return session;
    },
  },
});
export { handler as GET, handler as POST };
