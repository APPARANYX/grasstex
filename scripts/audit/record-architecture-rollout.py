#!/usr/bin/env python3
"""Verify a merged architecture PR's rollout and retain compact provenance."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path


def gh(*args):
    return subprocess.check_output(['gh', *args], text=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('pr', type=int)
    parser.add_argument('--module', required=True)
    args = parser.parse_args()
    pr = json.loads(gh('pr', 'view', str(args.pr), '--json',
                       'state,headRefOid,headRefName,mergeCommit,mergedAt,url'))
    assert pr['state'] == 'MERGED', pr
    merge = pr['mergeCommit']['oid']
    runs = json.loads(gh('run', 'list', '--workflow', 'deploy-50webs-php.yml',
                         '--limit', '20', '--json', 'databaseId,headSha,status,conclusion,url'))
    deploy = next(r for r in runs if r['headSha'] == merge)
    runs = json.loads(gh('run', 'list', '--workflow', 'branch-housekeeping.yml',
                         '--limit', '20', '--json', 'databaseId,headSha,status,conclusion,url'))
    house = next(r for r in runs if r['headSha'] == pr['headRefOid'])
    for run in [deploy, house]:
        assert run['status'] == 'completed' and run['conclusion'] == 'success', run
    log = gh('run', 'view', str(deploy['databaseId']), '--log')
    build = re.findall(r'Published tag: (build-v\d+)', log)[-1]
    log = gh('run', 'view', str(house['databaseId']), '--log')
    assert 'Deleted ' + pr['headRefName'] + ' (merged in #' + str(args.pr) + ')' in log
    url = 'https://test.ivandpopov.com/grasstex/' + args.module + '?v=' + build.removeprefix('build-v')
    live = subprocess.check_output(['curl', '-fLsS', '-A', 'Mozilla/5.0', url])
    source = subprocess.check_output(['git', 'show', merge + ':' + args.module])
    assert live == source, 'Live module differs from merge source'
    out = Path('docs/audits/2026-10-20-grasstex/runtime-verification/artifacts/architecture-rollout')
    for name, data in [('deploy-result', deploy), ('housekeeping-result', house), ('live-source', {
            'url': url, 'sha256': hashlib.sha256(live).hexdigest(), 'matchesMergedSource': True})]:
        (out / f'{args.pr}-{name}.json').write_text(json.dumps(data, indent=2) + '\n')
    result = dict(pr=args.pr, testedHead=pr['headRefOid'], merge=merge, build=build,
                  deploymentRun=deploy['databaseId'], housekeepingRun=house['databaseId'],
                  branchDeleted=True, liveModule=args.module, liveModuleMatches=True)
    (out / f'rollout-{args.pr}.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
