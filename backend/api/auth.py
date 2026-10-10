"""Cognito ID token verification.

verify_token is pure: it gets a way to look up public keys and the current
time passed in. JwksCache is the only part that talks to the network; it
downloads Cognito's public keys once and reuses them while the Lambda is warm.
"""

import json
import urllib.request
from typing import Any, Callable

import jwt

from errors import ApiError

KeyLookup = Callable[[str], Any]

# Re-download keys for an unknown key ID at most this often (Cognito rotates keys rarely).
JWKS_REFRESH_SECONDS = 300


def verify_token(token: str, key_lookup: KeyLookup, issuer: str, client_id: str, now: float) -> str:
    """Return the user ID (`sub`) of a valid ID token, or raise ApiError(401)."""
    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError:
        raise ApiError(401, "Invalid token")

    key = key_lookup(header.get("kid", ""))
    if key is None:
        raise ApiError(401, "Invalid token")

    try:
        claims = jwt.decode(
            token,
            key=key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=issuer,
            # Expiry is checked below against the injected clock.
            options={"require": ["exp", "iss", "aud", "sub", "token_use"], "verify_exp": False},
        )
    except jwt.PyJWTError:
        raise ApiError(401, "Invalid token")

    if claims["exp"] <= now:
        raise ApiError(401, "Token expired")
    if claims["token_use"] != "id":
        raise ApiError(401, "Invalid token")
    return claims["sub"]


def _fetch_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=5) as response:
        return json.load(response)


class JwksCache:
    """Cognito's public signing keys, fetched on first use and cached."""

    def __init__(self, url: str, clock: Callable[[], float], fetch: Callable[[str], dict] = _fetch_json):
        self._url = url
        self._clock = clock
        self._fetch = fetch
        self._keys: dict[str, Any] | None = None
        self._fetched_at = 0.0

    def _refresh(self) -> None:
        jwks = self._fetch(self._url)
        self._keys = {k["kid"]: jwt.PyJWK(k).key for k in jwks["keys"]}
        self._fetched_at = self._clock()

    def lookup(self, kid: str) -> Any:
        if self._keys is None:
            self._refresh()
        elif kid not in self._keys and self._clock() - self._fetched_at > JWKS_REFRESH_SECONDS:
            self._refresh()  # keys may have rotated
        return self._keys.get(kid)
