import { OAuth2Strategy } from "remix-auth-oauth2";
import createDebug from "debug";
import type { StrategyVerifyCallback } from "remix-auth";
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";

let debug = createDebug("RemixAuthGitea");

// Gitea OAuth2 scopes: Currently Gitea does not support scopes.
// https://docs.gitea.io/en-us/oauth2-provider/#scopes

export interface GiteaStrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  domain: string;
  userAgent?: string;
}

export interface GiteaProfile extends OAuth2Profile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
    middleName: string;
  };
  emails: [{ value: string }];
  photos: [{ value: string }];
  _json: {
    username: string;
    has_2fa_enabled: boolean | null;
    display_name: string;
    account_id: string;
    links: {
      hooks: { href: string };
      self: { href: string };
      repositories: { href: string };
      html: { href: string };
      avatar: { href: string };
      snippets: { href: string };
    };
    nickname: string;
    created_on: string;
    is_staff: boolean;
    location: string | null;
    account_status: string;
    type: string;
    uuid: string;
    emails: unknown;
  };
}

export interface GiteaExtraParams extends Record<string, string | number> {
  tokenType: string;
}

export class GiteaStrategy<User> extends OAuth2Strategy<
  User,
  GiteaProfile,
  GiteaExtraParams
> {
  name = "gitea";

  private userAgent: string;
  private userInfoURL: string;

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      domain,
      userAgent,
    }: GiteaStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<GiteaProfile, GiteaExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL: `${domain}/login/oauth/authorize`,
        tokenURL: `${domain}/login/oauth/access_token`,
      },
      verify
    );
    this.userInfoURL = `${domain}/api/v1/user`;
    this.userAgent = userAgent ?? "Remix Auth";
  }

  protected async userProfile(accessToken: string): Promise<GiteaProfile> {
    let profile: GiteaProfile;

    try {
      debug("Calling API por userInfo", this.userInfoURL);
      let response = await fetch(this.userInfoURL, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": this.userAgent,
        },
      });

      debug("Response", response);
      let data = await response.json();
      debug("Calling User Profile API - Response", data);

      profile = {
        provider: "gitea",
        displayName: data.login,
        id: String(data.id),
        name: {
          familyName: data.full_name,
          givenName: data.full_name,
          middleName: data.full_name,
        },
        emails: [{ value: data.email }],
        photos: [{ value: data.avatar_url }],
        _json: data,
      };

      debug("Profile", profile);
      return profile;
    } catch (error) {
      throw new Error(`Could not parse user account. ${error}`);
    }
  }

  protected async getAccessToken(response: Response): Promise<{
    accessToken: string;
    refreshToken: string;
    extraParams: GiteaExtraParams;
  }> {
    let { access_token, refresh_token, ...extraParams } = await response.json();
    debug("Retrieved AccessToken", access_token);
    debug("Retrieved RefreshToken", refresh_token);
    return {
      accessToken: access_token as string,
      refreshToken: refresh_token as string,
      extraParams,
    } as const;
  }
}
