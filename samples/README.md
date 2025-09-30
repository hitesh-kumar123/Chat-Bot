Samples

This folder holds tiny sample assets used for quick testing.

Included (generated via script):

- sample.pdf: a 2-page PDF with known keywords
- sample.png: a small generated image

Audio (not included):

- Place a short audio clip at `samples/sample.wav` or `samples/sample.mp3` if you want to test audio ingestion. See backend/scripts/setup_whisper_cpp.sh for Whisper.cpp setup.

Generate files

```
cd backend
python scripts/generate_samples.py
```

Then ingest into the running backend:

```
curl -F "file=@samples/sample.pdf" http://localhost:8000/ingest
curl -F "file=@samples/sample.png" http://localhost:8000/ingest
# optional
curl -F "file=@samples/sample.wav" http://localhost:8000/ingest
```
