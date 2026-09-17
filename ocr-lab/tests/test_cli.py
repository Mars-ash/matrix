import json
import subprocess
import sys

from PIL import Image


def test_check_env_does_not_load_model():
    completed = subprocess.run(
        [sys.executable, "-m", "bom_ocr.cli", "check-env"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert completed.returncode == 0, completed.stderr
    info = json.loads(completed.stdout)
    assert info["pythonSupported"] is True
    assert info["device"] == "cpu"
    assert info["modelLoaded"] is False


def test_extract_empty_image_returns_failure_artifacts_without_loading_model(tmp_path):
    source = tmp_path / "blank.png"
    Image.new("RGB", (200, 100), "white").save(source)
    output = tmp_path / "result"
    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "bom_ocr.cli",
            "extract",
            "--input",
            str(source),
            "--output",
            str(output),
            "--allow-output-outside-lab",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert completed.returncode == 2, completed.stderr
    assert output.is_dir()
    result = json.loads((output / "result.json").read_text())
    assert result["success"] is False
    assert result["rows"] == []
    assert result["warnings"][0]["code"] == "no_table"


def test_cli_refuses_output_outside_lab_before_extraction(tmp_path):
    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "bom_ocr.cli",
            "extract",
            "--input",
            "missing.png",
            "--output",
            str(tmp_path / "out"),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert completed.returncode != 0
    assert "allow-output-outside-lab" in completed.stderr
    assert not (tmp_path / "out").exists()


def test_incomplete_benchmark_fails_and_never_claims_a_pass(tmp_path):
    completed = subprocess.run(
        [
            sys.executable,
            "-m",
            "bom_ocr.cli",
            "benchmark",
            "--corpus",
            str(tmp_path),
            "--report",
            str(tmp_path / "report"),
            "--allow-output-outside-lab",
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    assert completed.returncode != 0
    assert not (tmp_path / "report" / "report.json").exists()
