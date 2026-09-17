import pytest


def pytest_collection_modifyitems(config, items):
    # A bare pytest command must never implicitly load/download a model.
    expression = config.option.markexpr.strip()
    for item in items:
        if "model" in item.keywords and expression != "model":
            item.add_marker(pytest.mark.skip(reason="Model tests require explicit -m model"))
        if "private_corpus" in item.keywords and expression != "private_corpus":
            item.add_marker(pytest.mark.skip(reason="Private corpus tests require explicit opt-in"))
