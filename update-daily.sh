#!/bin/bash
cd ~/Desktop/atelier-ai
node run-brain.mjs
node build-index.mjs
git add .
git commit -m "Daily update $(date +%Y-%m-%d)"
git push origin master
echo "✅ Sito aggiornato $(date)"
