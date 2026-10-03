#!/usr/bin/env bash
set -euo pipefail

SRC_REPO="APPARANYX/grasstex"
KEY_REPO="APPARANYX/grasstex-audio"
SECRET="PRIVATE_AUDIO_READ_KEY"
TITLE="Grasstex private audio read"

tmp="$(mktemp -d)"
priv="$tmp/id_ed25519"
pub="$priv.pub"
done_ok=0

cleanup() {
  rm -rf "$tmp"
  if [[ "$done_ok" == "1" ]]; then
    self="$(cd -- "$(dirname -- "$0")" && pwd)/$(basename -- "$0")"
    root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
    if [[ -n "$root" && "$self" == "$root/"* ]]; then
      rel="${self#"$root/"}"
      git -C "$root" update-index --skip-worktree -- "$rel" 2>/dev/null || true
    fi
    rm -f -- "$self" 2>/dev/null || true
  fi
}
trap cleanup EXIT

need() {
  command -v "$1" >/dev/null || {
    echo "Missing required command: $1" >&2
    exit 1
  }
}

need gh
need git
need ssh-keygen
need ssh

echo "Checking GitHub authentication..."
gh auth status >/dev/null

echo "Generating key..."
ssh-keygen -q -t ed25519 \
  -C "grasstex-private-audio-read" \
  -f "$priv" \
  -N ""
chmod 600 "$priv"

echo "Removing any previous one-shot key with this title..."
while IFS= read -r id; do
  [[ -n "$id" ]] || continue
  gh api --method DELETE "repos/$KEY_REPO/keys/$id" >/dev/null
done < <(
  gh api "repos/$KEY_REPO/keys" \
    --jq ".[] | select(.title == \"$TITLE\") | .id"
)

echo "Installing read-only deploy key..."
if ! gh api --method POST "repos/$KEY_REPO/keys" \
    -f title="$TITLE" \
    -f key="$(cat "$pub")" \
    -F read_only=true >/dev/null
then
  cat >&2 <<'EOF'

GitHub refused deploy-key administration.

In this Codespace, authenticate gh with an account that has Admin access to
APPARANYX/grasstex-audio, then rerun:

  bash key.sh

If a Codespaces token is overriding gh, run:

  unset GH_TOKEN GITHUB_TOKEN
  gh auth login
EOF
  exit 1
fi

echo "Testing read access..."
GIT_SSH_COMMAND="ssh -i $priv -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=$tmp/known_hosts" \
  git ls-remote "git@github.com:$KEY_REPO.git" HEAD >/dev/null

echo "Saving private key as $SECRET..."
gh secret set "$SECRET" \
  --repo "$SRC_REPO" \
  < "$priv"

echo "Verifying..."
read_only="$(
  gh api "repos/$KEY_REPO/keys" \
    --jq ".[] | select(.title == \"$TITLE\") | .read_only" \
    | head -n1
)"
[[ "$read_only" == "true" ]] || {
  echo "Deploy key verification failed." >&2
  exit 1
}

gh secret list \
  --repo "$SRC_REPO" \
  --json name \
  --jq '.[].name' \
  | grep -Fx "$SECRET" >/dev/null

done_ok=1

echo
echo "Done: $SECRET is installed and the deploy key is read-only."
echo "Temporary key material is wiped."
echo "key.sh will now delete itself from this Codespace checkout."