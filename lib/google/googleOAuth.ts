import { google } from "googleapis";

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    requiredEnvironmentVariable("GOOGLE_CLIENT_ID"),
    requiredEnvironmentVariable("GOOGLE_CLIENT_SECRET"),
    requiredEnvironmentVariable("GOOGLE_REDIRECT_URI"),
  );
}

export function createAuthorizedGoogleOAuthClient() {
  const oauthClient = createGoogleOAuthClient();

  oauthClient.setCredentials({
    refresh_token: requiredEnvironmentVariable("GOOGLE_REFRESH_TOKEN"),
  });

  return oauthClient;
}