/** Turn an Amplify/Cognito auth error into a sentence a user can act on. */
export function authErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : ''
  switch (name) {
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      // Same message for both, so emails can't be probed (matches the user pool setting).
      return 'Email or password is incorrect.'
    case 'UsernameExistsException':
      return 'An account with this email already exists. Try signing in.'
    case 'InvalidPasswordException':
      return 'That password doesn’t meet the rules below.'
    case 'CodeMismatchException':
      return 'That code is incorrect. Check the latest email and try again.'
    case 'ExpiredCodeException':
      return 'That code has expired. Request a new one.'
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return 'Too many attempts. Wait a few minutes and try again.'
    case 'EmptySignInUsername':
    case 'EmptySignUpUsername':
      return 'Enter your email.'
    case 'EmptySignInPassword':
    case 'EmptySignUpPassword':
      return 'Enter your password.'
    default:
      return 'Something went wrong. Try again.'
  }
}
