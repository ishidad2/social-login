import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';

const handler = NextAuth({
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
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
	],
	callbacks: {
    async jwt({ token, account }) {
      // 初回サインイン時にアクセストークンをトークンに保存
      if (account) {
        token.accessToken = account.access_token;
				token.scope = account.scope;
      }
      return token;
    },
    async session({ session, token }) {
      // セッションにアクセストークンを含める
      session.accessToken = token.accessToken;
			session.scope = token.scope;
      return session;
    },
  },
});
export { handler as GET, handler as POST };
