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
		}),
	]
});
export { handler as GET, handler as POST };
