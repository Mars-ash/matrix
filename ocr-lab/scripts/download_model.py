"""Explicit one-time setup. Never called by extract or benchmark."""

import argparse
import hashlib
import json
import tarfile
import urllib.request
from pathlib import Path

MODEL = "PP-OCRv5_mobile_rec"
URL = (
    "https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/"
    "paddle3.0.0/PP-OCRv5_mobile_rec_infer.tar"
)
FILES = {"inference.json", "inference.pdiparams", "inference.yml"}
LAB = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description="Download approved official OCR model assets")
    parser.add_argument("--confirm-download", action="store_true", required=True)
    parser.parse_args()
    destination = LAB / "model-cache" / MODEL
    if destination.exists():
        raise SystemExit("Model destination already exists; inspect it before replacing assets.")
    staging = LAB / ".downloads"
    staging.mkdir(exist_ok=True)
    archive = staging / f"{MODEL}.tar"
    # This fixed HTTPS request sends no source image or project content.
    with urllib.request.urlopen(URL, timeout=90) as response, archive.open("wb") as output:
        total = 0
        while block := response.read(1024 * 1024):
            total += len(block)
            if total > 100 * 1024 * 1024:
                raise SystemExit("Model archive exceeds the setup limit.")
            output.write(block)
    with tarfile.open(archive) as bundle:
        selected = {}
        for member in bundle.getmembers():
            name = member.name.rsplit("/", 1)[-1]
            if name not in FILES:
                continue
            if not member.isfile() or member.size > 100 * 1024 * 1024 or name in selected:
                raise SystemExit("Unexpected model archive structure.")
            stream = bundle.extractfile(member)
            if stream is None:
                raise SystemExit("Unreadable model member.")
            selected[name] = stream.read()
        if selected.keys() != FILES:
            raise SystemExit("The archive does not contain the required inference files.")
    destination.mkdir(parents=True)
    for name, content in selected.items():
        (destination / name).write_bytes(content)
    manifest = {
        "model": MODEL,
        "source": URL,
        "archiveSha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
        "files": {
            name: hashlib.sha256(content).hexdigest() for name, content in sorted(selected.items())
        },
    }
    (destination / "setup-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    print("Official mobile recognition model cached locally. No images were uploaded.")


if __name__ == "__main__":
    main()
