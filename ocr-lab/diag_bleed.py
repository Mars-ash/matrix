import tempfile, pathlib
from PIL import ImageDraw
from bom_ocr.config import LabConfig
from bom_ocr.preprocessing import preprocess_image
from bom_ocr.grid import _grid_candidate, _source_edge_bounds, _has_partial_separator, _merge_lines, _coverage
import cv2, numpy as np

from tests.support.synthetic_table import synthetic_table

def make_bleed():
    image = synthetic_table(6, 4, text=False)
    d = ImageDraw.Draw(image)
    for y in (24, 80, 136, 192, 248):
        d.line((600, y, 626, y), fill="#c000c0", width=2)
    return image.crop((0, 0, 627, image.height))

def make_stub():
    image = synthetic_table(6, 4, text=False)
    return image.crop((0, 0, 24 + 5*100 + 5, image.height))

cfg = LabConfig()
for name, img in (("bleed", make_bleed()), ("stub", make_stub()), ("clean-crop", synthetic_table(6,4,text=False).crop((0,0,624,273)))):
    with tempfile.TemporaryDirectory() as td:
        p = pathlib.Path(td)/"g.png"
        img.save(p)
        prep = preprocess_image(p, cfg)
        print("="*20, name, img.size, "deskew=", prep.deskew_degrees, "working=", prep.working.shape)
        merged = cv2.bitwise_or(prep.horizontal_mask, prep.vertical_mask)
        joined = cv2.dilate(merged, np.ones((3,3), np.uint8))
        count, _, stats, _ = cv2.connectedComponentsWithStats(joined, connectivity=8)
        print("components:", count-1)
        for i in range(1, count):
            x,y,w,h,area = (int(v) for v in stats[i])
            print(f"  comp{i}: x={x} y={y} w={w} h={h} area={area}")
            if w < 40 or h < 20 or area < 100:
                print("    skipped-too-small"); continue
            hm = prep.horizontal_mask[y:y+h, x:x+w]
            vm = prep.vertical_mask[y:y+h, x:x+w]
            horiz = tuple(y+p2 for p2 in _merge_lines(np.count_nonzero(hm, axis=1), max(10, w*0.5), cfg.line_tolerance))
            vert = tuple(x+p2 for p2 in _merge_lines(np.count_nonzero(vm, axis=0), max(10, h*0.5), cfg.line_tolerance))
            print(f"    H={horiz}")
            print(f"    V={vert}")
            radius = max(2, cfg.line_tolerance)
            rb = _source_edge_bounds(horiz, vert, prep.vertical_mask, prep.binary, radius, horizontal=True)
            cb = _source_edge_bounds(vert, horiz, prep.horizontal_mask, prep.binary, radius, horizontal=False)
            print(f"    row_bounds={rb}")
            print(f"    col_bounds={cb}")
            if rb is not None and cb is not None:
                h2,(cr) = rb; v2,(cc) = cb
                print("    partialH=", _has_partial_separator(prep.horizontal_mask, h2, v2, radius, horizontal=True),
                      "partialV=", _has_partial_separator(prep.vertical_mask, v2, h2, radius, horizontal=False))
            cand = _grid_candidate(prep, (x,y,w,h), cfg)
            print("    candidate=", None if cand is None else (cand.grid, [w2.code for w2 in cand.warnings]))
