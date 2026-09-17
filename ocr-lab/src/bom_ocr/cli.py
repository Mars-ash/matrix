"""Command-line entrypoint. Model imports are deferred until extraction."""

import argparse
import importlib.metadata
import json
import platform
import sys
from dataclasses import replace
from pathlib import Path


def check_environment():
    packages = {}
    for name in (
        "paddlepaddle",
        "paddleocr",
        "paddlex",
        "numpy",
        "opencv-contrib-python",
        "Pillow",
    ):
        try:
            packages[name] = importlib.metadata.version(name)
        except importlib.metadata.PackageNotFoundError:
            packages[name] = None
    return {
        "python": platform.python_version(),
        "pythonSupported": (3, 11) <= sys.version_info[:2] < (3, 14),
        "device": "cpu",
        "modelLoaded": False,
        "packages": packages,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Local, review-only BOM image OCR")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("check-env", help="Inspect runtime without loading a model")
    extract = commands.add_parser("extract", help="Extract one PNG/JPEG to review artifacts")
    extract.add_argument("--input", type=Path, required=True)
    extract.add_argument("--output", type=Path)
    benchmark = commands.add_parser("benchmark", help="Evaluate paired private images and truth")
    benchmark.add_argument("--corpus", type=Path, required=True)
    benchmark.add_argument("--report", type=Path, required=True)
    benchmark.add_argument("--repeat", type=int, default=3)
    benchmark.add_argument(
        "--no-egress-evidence",
        type=Path,
        help="Local text file documenting enforced OS network isolation",
    )
    for command in (extract, benchmark):
        command.add_argument("--allow-output-outside-lab", action="store_true")
        command.add_argument("--max-long-edge", type=int, default=2048)
    args = parser.parse_args(argv)
    if args.command == "check-env":
        info = check_environment()
        print(json.dumps(info, indent=2))
        return 0 if info["pythonSupported"] else 1
    from .annotation import LAB_ROOT, validate_output_path, write_artifacts
    from .config import LabConfig
    from .offline import network_disabled
    from .pipeline import extract_image
    from .recognition import PaddleCellRecognizer

    try:
        config = replace(LabConfig(), max_long_edge=args.max_long_edge)
        recognizer = PaddleCellRecognizer(config)
        if args.command == "extract":
            destination = validate_output_path(
                args.output or LAB_ROOT / "output" / args.input.stem,
                allow_outside=args.allow_output_outside_lab,
            )
            with network_disabled():
                result = extract_image(args.input, recognizer, config)
                result = write_artifacts(
                    args.input, result, destination, allow_outside=args.allow_output_outside_lab
                )
            print(
                json.dumps(
                    {
                        "success": result.success,
                        "rowCount": len(result.rows),
                        "requiresReview": True,
                        "warningCodes": [w.code for w in result.warnings],
                        "artifacts": result.artifacts.to_dict(),
                    },
                    indent=2,
                )
            )
            return 0 if result.success else 2
        from .benchmark import run_benchmark, write_report

        destination = validate_output_path(args.report, allow_outside=args.allow_output_outside_lab)
        evidence = None
        if args.no_egress_evidence is not None:
            if args.no_egress_evidence.stat().st_size > 65536:
                raise ValueError("Network isolation evidence must be a short local text file.")
            evidence = args.no_egress_evidence.read_text(encoding="utf-8-sig")
        with network_disabled():
            report = run_benchmark(
                args.corpus,
                lambda path: extract_image(path, recognizer, config),
                config,
                repeat=args.repeat,
                no_egress_evidence=evidence,
            )
            paths = write_report(report, destination)
        print(
            json.dumps(
                {
                    "passed": report.passed,
                    "failures": list(report.failures),
                    "requiresHumanSignOff": True,
                    "artifacts": {name: str(path) for name, path in paths.items()},
                },
                indent=2,
            )
        )
        return 0 if report.passed else 2
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 2
    except OSError:
        print(
            "Local input/output failed. Check the source, output path, and permissions.",
            file=sys.stderr,
        )
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
