import { createCookieSessionStorage } from "@remix-run/server-runtime";
import { GiteaStrategy } from "../src";

export const GiteaTest = describe(GiteaStrategy, () => {
  const verify = jest.fn();
  const sessionStorage = createCookieSessionStorage({
    cookie: { secrets: ["s3cr3t"] },
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should correctly format the authorization URL", async () => {
    const strategy = new GiteaStrategy(
      {
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
        domain: "https://example.com",
      },
      verify
    );

    const request = new Request("https://example.app/auth/gilab");

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;

      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.hostname).toBe("example.com");
      expect(redirectUrl.pathname).toBe("/login/oauth/authorize");
    }
  });
});
