from __future__ import annotations

from PIL import Image


def get_image_size(path: str) -> tuple[int, int]:
    with Image.open(path) as im:
        return im.width, im.height


