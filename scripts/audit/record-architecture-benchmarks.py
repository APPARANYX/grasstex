#!/usr/bin/env python3
"""Retain standard-run provenance/raw JSON and invoke the existing arm comparator."""
import argparse
import json
import shutil
import subprocess
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--phase', required=True)
    parser.add_argument('--baseline-run', required=True)
    parser.add_argument('--candidate-run', required=True)
    parser.add_argument('--baseline-dir', type=Path, required=True)
    parser.add_argument('--candidate-dir', type=Path, required=True)
    parser.add_argument('--label', default='')
    args = parser.parse_args()
    out = Path('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts') / args.phase
    out.mkdir(exist_ok=True)
    prefix = args.label + '-' if args.label else ''
    for name in ['baseline', 'candidate']:
        rid, source = getattr(args, name + '_run'), getattr(args, name + '_dir')
        metadata = json.loads(subprocess.check_output([
            'gh', 'run', 'view', rid, '--json', 'status,conclusion,headSha,url'], text=True))
        assert metadata['status'] == 'completed' and metadata['conclusion'] == 'success', metadata
        (out / (prefix + name + '-run.json')).write_text(json.dumps(metadata, indent=2) + '\n')
        for path in source.rglob('*.json'):
            dest = out / (prefix + 'benchmark-' + name) / path.relative_to(source)
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, dest)
    passed = True
    for arm in ['off', 'on']:
        lists = []
        for source in [args.baseline_dir, args.candidate_dir]:
            files = sorted(source.glob('**/' + arm + '/battle-benchmark.json'))
            assert files, source
            lists.append(','.join(str(p) for p in files))
        result = subprocess.run(['node', 'scripts/compare_benchmark_arms.cjs', '--json', *lists],
                                capture_output=True, text=True)
        assert result.stdout, result.stderr
        (out / (prefix + 'cross-' + arm + '.json')).write_text(result.stdout)
        data = json.loads(result.stdout)
        identical = data['pairs'] > 0 and data['identicalBattles'] == data['pairs'] and not any(data['unpaired'].values())
        passed = passed and result.returncode == 0 and identical
        print(json.dumps(dict(arm=arm, pairs=data['pairs'], identical=data['identicalBattles'],
                              errors=data['runtimeErrors'], wall=data['wallSeconds'], passGate=data['pass'])))
    raise SystemExit(0 if passed else 1)


if __name__ == '__main__':
    main()
