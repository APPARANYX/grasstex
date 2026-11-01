#!/usr/bin/env python3
"""Offline contract tests for safe benchmark-launch branch housekeeping."""
import importlib.util
import json
import pathlib
import unittest
from types import SimpleNamespace
from unittest.mock import patch

FILE = pathlib.Path(__file__).with_name("housekeeping-benchmark-launches.py")
spec = importlib.util.spec_from_file_location("benchmark_housekeeping", FILE)
housekeeping = importlib.util.module_from_spec(spec)
spec.loader.exec_module(housekeeping)


class HousekeepingTests(unittest.TestCase):
    def test_launcher_must_be_exact_successful_head(self):
        sha = "a" * 40
        result = {"workflow_runs": [
            {"head_sha": sha, "path": housekeeping.WORKFLOW,
             "status": "completed", "conclusion": "success"},
        ]}
        with patch.object(housekeeping, "gh", return_value=result):
            self.assertTrue(housekeeping.successful_launcher(sha))
        result["workflow_runs"][0]["conclusion"] = "failure"
        with patch.object(housekeeping, "gh", return_value=result):
            self.assertFalse(housekeeping.successful_launcher(sha))
        result["workflow_runs"][0]["conclusion"] = "success"
        result["workflow_runs"][0]["head_sha"] = "b" * 40
        with patch.object(housekeeping, "gh", return_value=result):
            self.assertFalse(housekeeping.successful_launcher(sha))

    def test_active_run_blocks_deletion(self):
        with patch.object(housekeeping, "gh", return_value={
            "workflow_runs": [{"status": "queued"}, {"status": "completed"}]}):
            self.assertTrue(housekeeping.active_run("work/example"))
        with patch.object(housekeeping, "gh", return_value={
            "workflow_runs": [{"status": "completed"}]}):
            self.assertFalse(housekeeping.active_run("work/example"))

    def test_main_ancestor_needs_no_tag(self):
        with patch.object(housekeeping, "run", return_value=SimpleNamespace(returncode=0)):
            with patch.object(housekeeping, "gh") as api:
                self.assertEqual(housekeeping.retain_parent("a" * 40), "main-ancestor")
                api.assert_not_called()

    def test_unmerged_parent_is_pinned_before_deletion(self):
        sha = "b" * 40
        tag = f"archive/benchmark-source/{sha}"
        with patch.object(housekeeping, "run", return_value=SimpleNamespace(returncode=1)):
            with patch.object(housekeeping, "gh", side_effect=[
                    None, {}, {"object": {"sha": sha}}]) as api:
                self.assertEqual(housekeeping.retain_parent(sha), tag)
                self.assertEqual(api.call_args_list[1].kwargs["method"], "POST")

    def test_archive_rejects_conflicting_existing_record(self):
        with patch.object(housekeeping, "fetch_archive", return_value="not our archive"):
            with patch.object(housekeeping, "gh") as api:
                with self.assertRaisesRegex(RuntimeError, "Archive conflict"):
                    housekeeping.archive("c" * 40, {"branch": "test"})
                api.assert_not_called()

    def test_archive_is_verified_before_branch_can_be_deleted(self):
        payload = {"branch": "work/benchmark-launch/old", "launch_sha": "d" * 40}
        content = json.dumps(payload, sort_keys=True, indent=2) + "\n"
        with patch.object(housekeeping, "fetch_archive", side_effect=[None, content]):
            with patch.object(housekeeping, "gh", return_value={}) as api:
                path = housekeeping.archive("d" * 40, payload)
                self.assertEqual(path, "benchmarks/launch-requests/" + "d" * 40 + ".json")
                self.assertEqual(api.call_args.kwargs["method"], "PUT")


if __name__ == "__main__":
    unittest.main()
