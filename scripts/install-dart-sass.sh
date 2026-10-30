#!/usr/bin/env sh
# Installe Dart Sass (requis par Hugo pour compiler le SCSS du thème) dans ${HOME}/.local/dart-sass.
# Utilisé par Netlify (cf. netlify.toml), dont l'image de build ne fournit pas Dart Sass.
set -eu

DART_SASS_VERSION="${DART_SASS_VERSION:-1.107.1}"
ARCHIVE="dart-sass-${DART_SASS_VERSION}-linux-x64.tar.gz"

mkdir -p "${HOME}/.local"
curl -sfLO "https://github.com/sass/dart-sass/releases/download/${DART_SASS_VERSION}/${ARCHIVE}"
tar -C "${HOME}/.local" -xzf "${ARCHIVE}"
rm "${ARCHIVE}"

"${HOME}/.local/dart-sass/sass" --version
