# User accounts. Each user's `sub` is the userId on their measurements, so
# recreating the pool would orphan all history: hence this stack.
resource "aws_cognito_user_pool" "users" {
  name           = "liftlens-users"
  user_pool_tier = "LITE" # 10,000 monthly active users free

  # Sign in with email; verify it with an emailed code before the account works.
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length                   = 12
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Cognito's built-in sender: free, up to 50 emails a day.
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  deletion_protection = "ACTIVE"
}

# The browser app's client. No secret: code in a browser can't keep one.
resource "aws_cognito_user_pool_client" "web" {
  name         = "liftlens-web"
  user_pool_id = aws_cognito_user_pool.users.id

  generate_secret = false

  # SRP for the browser: the password itself is never sent.
  # USER_PASSWORD_AUTH lets the CLI fetch a token for smoke tests; the password
  # goes over HTTPS to Cognito only. Revisit once the browser app signs in (M3).
  explicit_auth_flows = ["ALLOW_USER_SRP_AUTH", "ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]

  id_token_validity      = 1
  access_token_validity  = 1
  refresh_token_validity = 30
  token_validity_units {
    id_token      = "hours"
    access_token  = "hours"
    refresh_token = "days"
  }

  # Same response whether or not an email is registered, so emails can't be probed.
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true
}
