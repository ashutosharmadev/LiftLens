import pytest

from auth import JWKS_REFRESH_SECONDS, JwksCache, verify_token
from conftest import CLIENT_ID, ISSUER, NOW, new_private_key
from errors import ApiError

NOW_TS = NOW.timestamp()


def verify(token, key_lookup):
    return verify_token(token, key_lookup, ISSUER, CLIENT_ID, NOW_TS)


def test_valid_token_returns_the_user_id(make_token, key_lookup):
    assert verify(make_token(sub="user-42"), key_lookup) == "user-42"


@pytest.mark.parametrize(
    "overrides",
    [
        {"exp": int(NOW_TS) - 1},  # expired
        {"exp": int(NOW_TS)},  # expires exactly now
        {"iss": "https://cognito-idp.ap-south-1.amazonaws.com/someone-else"},
        {"aud": "another-app"},
        {"token_use": "access"},
        {"sub": None},  # missing sub
        {"exp": None},  # missing exp
    ],
    ids=["expired", "expires-now", "wrong-issuer", "wrong-client", "access-token", "no-sub", "no-exp"],
)
def test_rejects_bad_claims(make_token, key_lookup, overrides):
    with pytest.raises(ApiError) as err:
        verify(make_token(**overrides), key_lookup)
    assert err.value.status == 401


def test_rejects_a_token_signed_by_another_key(make_token, key_lookup):
    forged = make_token(key=new_private_key())
    with pytest.raises(ApiError):
        verify(forged, key_lookup)


def test_rejects_an_edited_payload(make_token, key_lookup):
    # Swap in another user's ID without re-signing: the signature no longer matches.
    import base64
    import json

    header, payload, signature = make_token().split(".")
    claims = json.loads(base64.urlsafe_b64decode(payload + "=="))
    claims["sub"] = "someone-else"
    tampered = base64.urlsafe_b64encode(json.dumps(claims).encode()).rstrip(b"=").decode()
    with pytest.raises(ApiError):
        verify(f"{header}.{tampered}.{signature}", key_lookup)


def test_rejects_an_unknown_key_id(make_token, key_lookup):
    with pytest.raises(ApiError):
        verify(make_token(kid="unknown"), key_lookup)


@pytest.mark.parametrize("garbage", ["", "not-a-jwt", "a.b.c"])
def test_rejects_garbage(garbage, key_lookup):
    with pytest.raises(ApiError):
        verify(garbage, key_lookup)


class TestJwksCache:
    JWKS = {"keys": [{"kty": "RSA", "kid": "k1", "alg": "RS256", "use": "sig", "n": "sXch", "e": "AQAB"}]}

    def make(self):
        calls, now = [], [1000.0]

        def fetch(url):
            calls.append(url)
            return self.JWKS

        cache = JwksCache("https://example/jwks.json", clock=lambda: now[0], fetch=fetch)
        return cache, calls, now

    def test_fetches_once_and_reuses(self):
        cache, calls, _ = self.make()
        assert cache.lookup("k1") is not None
        cache.lookup("k1")
        assert len(calls) == 1

    def test_unknown_key_refreshes_only_after_the_wait(self):
        cache, calls, now = self.make()
        cache.lookup("k1")
        assert cache.lookup("k2") is None
        assert len(calls) == 1
        now[0] += JWKS_REFRESH_SECONDS + 1
        cache.lookup("k2")
        assert len(calls) == 2
