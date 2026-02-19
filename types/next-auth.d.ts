import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      username: string;
      firstName: string;
      profilePicture: string | null;
    };
    pendingRegistration?: {
      email: string;
      firstName: string;
      lastName: string;
      oauth2Id: string;
      oauth2Provider: string;
      profilePicture: string;
    };
  }
}
