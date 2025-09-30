import os
from backend.app.extractors import extract_pdf, extract_docx, extract_image


def test_extract_pdf():
  pdf = os.path.join('samples', 'sample.pdf')
  assert os.path.exists(pdf), 'run: python backend/scripts/generate_samples.py'
  chunks = extract_pdf(pdf, 'sample.pdf')
  assert any('Solar panel' in c.content for c in chunks)


def test_extract_image():
  img = os.path.join('samples', 'sample.png')
  assert os.path.exists(img)
  chunks = extract_image(img, 'sample.png')
  assert len(chunks) == 1
  assert 'Image:' in chunks[0].content


