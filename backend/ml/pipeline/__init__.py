"""
CRAFTORA ML Pipeline Package
Provides local, offline machine learning components for craft product analysis.
"""

from .validator import validate_image
from .enhancer import enhance_craft_image
from .detector import detect_craft_object
from .classifier import classify_craft
from .attributes import extract_attributes
from .authenticity import compute_handmade_indicators
from .catalog_generator import generate_catalog_story
from .orchestrator import CraftoraMLPipeline, decode_image_input

__all__ = [
    "validate_image",
    "enhance_craft_image",
    "detect_craft_object",
    "classify_craft",
    "extract_attributes",
    "compute_handmade_indicators",
    "generate_catalog_story",
    "CraftoraMLPipeline",
    "decode_image_input"
]
