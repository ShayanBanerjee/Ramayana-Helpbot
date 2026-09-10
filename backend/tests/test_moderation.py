from src.moderation import is_flagged


class FakeModerationResult:
    def __init__(self, flagged):
        self.flagged = flagged


class FakeModerationResponse:
    def __init__(self, flagged):
        self.results = [FakeModerationResult(flagged)]


class FakeModerationClient:
    def __init__(self, flagged=False, raise_error=False):
        self.flagged = flagged
        self.raise_error = raise_error
        self.calls = []

        class _Moderations:
            def create(_self, model, input):
                self.calls.append((model, input))
                if self.raise_error:
                    raise RuntimeError("moderation endpoint unavailable")
                return FakeModerationResponse(self.flagged)

        self.moderations = _Moderations()


def test_is_flagged_true_when_client_reports_flagged():
    client = FakeModerationClient(flagged=True)
    assert is_flagged("some abusive text", client=client) is True
    assert client.calls == [("omni-moderation-latest", "some abusive text")]


def test_is_flagged_false_when_client_reports_clean():
    client = FakeModerationClient(flagged=False)
    assert is_flagged("Who is Hanuman?", client=client) is False


def test_is_flagged_fails_open_on_api_error():
    client = FakeModerationClient(raise_error=True)
    assert is_flagged("anything", client=client) is False


def test_is_flagged_skips_empty_text_without_calling_client():
    client = FakeModerationClient(flagged=True)
    assert is_flagged("   ", client=client) is False
    assert client.calls == []
