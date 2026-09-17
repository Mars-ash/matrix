"""Exercise the actual pytest runner so test selection cannot load a model by accident."""

import os
import subprocess
import sys
from pathlib import Path

import pytest


@pytest.mark.parametrize(
    ("expression", "runs_model"),
    [
        ("", False),
        ("not model and not private_corpus", False),
        ("model or private_corpus", False),
        ("model", True),
    ],
)
def test_model_tests_require_exact_explicit_selection(tmp_path, expression, runs_model):
    (tmp_path / "conftest.py").write_text(
        Path(__file__).with_name("conftest.py").read_text(encoding="utf-8"), encoding="utf-8"
    )
    (tmp_path / "pytest.ini").write_text(
        "[pytest]\nmarkers =\n    model: requires explicit opt-in\n"
        "    private_corpus: requires private data\n",
        encoding="utf-8",
    )
    (tmp_path / "test_probe.py").write_text(
        "import pytest\nfrom pathlib import Path\n"
        "@pytest.mark.model\ndef test_model_probe():\n"
        "    Path('model-was-run').touch()\n"
        "def test_ordinary():\n    pass\n",
        encoding="utf-8",
    )
    arguments = [sys.executable, "-m", "pytest", "-q"]
    if expression:
        arguments.extend(["-m", expression])
    completed = subprocess.run(
        arguments,
        cwd=tmp_path,
        env={**os.environ, "PYTEST_DISABLE_PLUGIN_AUTOLOAD": "1"},
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )
    assert completed.returncode == 0, completed.stdout + completed.stderr
    assert (tmp_path / "model-was-run").exists() is runs_model
