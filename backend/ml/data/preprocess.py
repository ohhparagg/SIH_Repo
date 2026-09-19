import os
import argparse
import pandas as pd
import cv2
import json

def report_stats(dataset_name: str, total_images: int, valid_images: int, classes: list):
    """Prints dataset statistics."""
    print(f"--- Dataset Preprocessing Report: {dataset_name} ---")
    print(f"Total Images Found: {total_images}")
    print(f"Valid/Usable Images: {valid_images}")
    print(f"Classes Found: {len(classes)} {classes}")

def preprocess_images(input_dir: str, output_dir: str, target_size=(224, 224)):
    """Removes corrupt images, normalizes format, and resizes."""
    if not os.path.exists(input_dir):
        print(f"Error: {input_dir} not found. Please provide the datasets.")
        return False
        
    os.makedirs(output_dir, exist_ok=True)
    valid_count = 0
    total_count = 0
    classes = []
    
    for root, dirs, files in os.walk(input_dir):
        for dir_name in dirs:
            classes.append(dir_name)
            
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                total_count += 1
                file_path = os.path.join(root, file)
                
                # Check for corruption
                try:
                    img = cv2.imread(file_path)
                    if img is not None:
                        # Normalize size and pixel values
                        img_resized = cv2.resize(img, target_size)
                        rel_path = os.path.relpath(root, input_dir)
                        out_folder = os.path.join(output_dir, rel_path)
                        os.makedirs(out_folder, exist_ok=True)
                        cv2.imwrite(os.path.join(out_folder, file), img_resized)
                        valid_count += 1
                except Exception as e:
                    print(f"Corrupt image removed: {file_path}")
                    
    report_stats(os.path.basename(input_dir), total_count, valid_count, classes)
    return valid_count > 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset_path", type=str, required=True, help="Path to raw dataset")
    parser.add_argument("--output_path", type=str, required=True, help="Path to preprocessed dataset")
    args = parser.parse_args()
    
    preprocess_images(args.dataset_path, args.output_path)
