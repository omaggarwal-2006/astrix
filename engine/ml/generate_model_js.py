"""
Generates engine/model.js by wrapping engine/model.json in window.LANDFALL_MODEL
so index.html can load it 100% offline via <script src="engine/model.js"> without CORS.
"""

from pathlib import Path

MODEL_JSON_PATH = Path(__file__).parent.parent / "model.json"
MODEL_JS_PATH = Path(__file__).parent.parent / "model.js"


def generate():
    with open(MODEL_JSON_PATH, "r", encoding="utf-8") as f:
        json_content = f.read()

    js_content = f"""/**
 * LANDFALL Model Weights (engine/model.js)
 * NASA Space Apps Challenge 2026 - Health Monitoring Software
 * 
 * Embeds model.json directly on window.LANDFALL_MODEL so the application works
 * 100% offline when opened directly via file:// in a browser without CORS fetch restrictions.
 */

(function(root) {{
  'use strict';

  const modelData = {json_content};

  if (typeof window !== 'undefined') {{
    window.LANDFALL_MODEL = modelData;
  }}

  if (typeof module === 'object' && module.exports) {{
    module.exports = modelData;
  }}
}}(typeof self !== 'undefined' ? self : this));
"""

    with open(MODEL_JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"Successfully generated {MODEL_JS_PATH} ({MODEL_JS_PATH.stat().st_size / 1024:.2f} KB)")


if __name__ == "__main__":
    generate()
