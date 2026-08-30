#!/usr/bin/env python3
"""Fail if staged/tracked files include likely assessment data or reports.

This guard inspects paths only. It never opens or prints sensitive file contents.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import PurePosixPath


BLOCKED_DIRECTORIES = {"data", "reports", "exports", "private-data", "security-quarantine"}
ALLOWED_PLACEHOLDERS = {"data/.gitkeep", "reports/.gitkeep"}
BLOCKED_EXTENSIONS = {".csv", ".json", ".xls", ".xlsx", ".zip", ".pdf"}


def tracked_paths() -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        check=True,
        stdout=subprocess.PIPE,
    )
    return [p.decode("utf-8", errors="surrogateescape") for p in result.stdout.split(b"\0") if p]


def is_blocked(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if normalized in ALLOWED_PLACEHOLDERS:
        return False
    item = PurePosixPath(normalized)
    return bool(item.parts and item.parts[0] in BLOCKED_DIRECTORIES and item.suffix.lower() in BLOCKED_EXTENSIONS)


def main() -> int:
    blocked = [path for path in tracked_paths() if is_blocked(path)]
    if blocked:
        print(f"BLOCK: {len(blocked)} candidate data/report artifact(s) are tracked.")
        print("Move them outside the repository and keep only .gitkeep placeholders.")
        return 1
    print("PASS: no candidate data/report artifacts are tracked.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
