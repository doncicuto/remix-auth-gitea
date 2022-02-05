# GiteaStrategy

The Gitea strategy for [remix-auth](https://github.com/sergiodxa/remix-auth) is used to authenticate users against a Gitea account. It extends the OAuth2Strategy.

The domain for our Gitea server including protocol and port must be specified. Example: `https://example.com:3000`

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## Usage

### Create an OAuth application

Follow the steps on [the Gitea documentation](https://docs.gitea.io/en-us/oauth2-provider/) to create a new application and get a client ID and secret.

### Create the strategy instance

```ts
import { GiteaStrategy } from "remix-auth-gitea";

let giteaStrategy = new GiteaStrategy(
  {
    clientID: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
    callbackURL: "https://example.com/auth/gitea/callback",
    domain: "http://example.com:3000", 
  },
  async ({ accessToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    return User.findOrCreate({ email: profile.emails[0].value });
  }
);

authenticator.use(giteaStrategy);
```

### Setup your routes

```tsx
// app/routes/login.tsx
export default function Login() {
  return (
    <Form action="/auth/gitea" method="post">
      <button>Login with Gitea</button>
    </Form>
  );
}
```

```tsx
// app/routes/auth/gitea.tsx
import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = () => redirect("/login");

export let action: ActionFunction = ({ request }) => {
  return authenticator.authenticate("gitea", request);
};
```

```tsx
// app/routes/auth/gitea/callback.tsx
import { LoaderFunction } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = ({ request }) => {
  return authenticator.authenticate("gitea", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
};
```

### Aknowledgements

[@sergiodxa](https://github.com/sergiodxa): for [remix-auth](https://github.com/sergiodxa/remix-auth), [remix-auth-strategy-template](https://github.com/sergiodxa/remix-auth-strategy-template) and for so many repositories and blog posts that make Remix easier to use and learn.
