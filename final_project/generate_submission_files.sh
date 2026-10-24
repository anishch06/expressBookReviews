#!/bin/bash
# Usage: ./generate_submission_files.sh <github-username> <repo-name>
# Start your server first (node index.js) in another terminal.
# Edit AUTHOR and TITLE below so they match a book in YOUR router/booksdb.js.

GH_USER="${1:?usage: $0 <github-username> <repo-name>}"
GH_REPO="${2:?usage: $0 <github-username> <repo-name>}"
AUTHOR="Chinua Achebe"
TITLE="Things Fall Apart"
ISBN=1
USERNAME="student$RANDOM"      # fresh user each run so registration succeeds
PASSWORD="pass123"

B=http://localhost:5000
H='Content-Type: application/json'
enc() { local v="$1"; echo "${v// /%20}"; }
JAR=$(mktemp)

# run <filename> <display command> <actual command...>
run() {
  local file="$1" shown="$2"; shift 2
  { echo "\$ $shown"; "$@"; echo; } > "$file" 2>&1
  echo "--- $file"; cat "$file"
}

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is not installed. Install it first (see instructions), then run this script again."; exit 1
fi
run githubrepo "curl -s https://api.github.com/repos/$GH_USER/$GH_REPO | jq -r '.parent.full_name'" \
  bash -c "curl -s https://api.github.com/repos/$GH_USER/$GH_REPO | jq -r '.parent.full_name'"
run getallbooks      "curl -s $B/" curl -s "$B/"
run getbooksbyISBN   "curl -s $B/isbn/$ISBN" curl -s "$B/isbn/$ISBN"
run getbooksbyauthor "curl -s $B/author/$(enc "$AUTHOR")" curl -s "$B/author/$(enc "$AUTHOR")"
run getbooksbytitle  "curl -s $B/title/$(enc "$TITLE")" curl -s "$B/title/$(enc "$TITLE")"
run getbookreview    "curl -s $B/review/$ISBN" curl -s "$B/review/$ISBN"
run register "curl -s -X POST $B/register -H \"$H\" -d '{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}'" \
  curl -s -X POST "$B/register" -H "$H" -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}"
run login "curl -s -c cookies.txt -X POST $B/customer/login -H \"$H\" -d '{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}'" \
  curl -s -c "$JAR" -X POST "$B/customer/login" -H "$H" -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}"
run reviewadded "curl -s -b cookies.txt -X PUT \"$B/customer/auth/review/$ISBN?review=Great%20read\"" \
  curl -s -b "$JAR" -X PUT "$B/customer/auth/review/$ISBN?review=Great%20read"
run deletereview "curl -s -b cookies.txt -X DELETE $B/customer/auth/review/$ISBN" \
  curl -s -b "$JAR" -X DELETE "$B/customer/auth/review/$ISBN"

rm -f "$JAR"
echo "Done. Files created: githubrepo getallbooks getbooksbyISBN getbooksbyauthor getbooksbytitle getbookreview register login reviewadded deletereview"
