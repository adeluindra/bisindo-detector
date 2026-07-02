import cv2
import mediapipe as mp
import numpy as np
import json
from tqdm import tqdm
import os
from sklearn.model_selection import train_test_split

# Inisialisasi MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,  # Gambar diam (bukan video stream)
    max_num_hands=2,
    min_detection_confidence=0.5
)

# Indeks landmark per jari untuk menghitung sudut sendi: [pangkal, MCP, PIP, DIP/TIP]
FINGER_JOINTS = {
    "thumb":  [0, 1, 2, 3, 4],
    "index":  [0, 5, 6, 7, 8],
    "middle": [0, 9, 10, 11, 12],
    "ring":   [0, 13, 14, 15, 16],
    "pinky":  [0, 17, 18, 19, 20],
}

def normalize_landmarks(landmarks):
    """landmarks: list of 21 (x, y, z) tuples"""
    wrist = landmarks[0]
    relative = np.array([
        [lm[0] - wrist[0], lm[1] - wrist[1], lm[2] - wrist[2]]
        for lm in landmarks
    ])
    max_val = np.max(np.abs(relative)) or 1e-6  # Hindari pembagian dengan nol
    normalized = relative / max_val
    return normalized.flatten().tolist()  # 21 * 3 = 63 nilai fitur

def calculate_angle(p1, p2, p3):
    """Menghitung sudut (dalam derajat) di titik p2 yang dibentuk oleh p1-p2-p3"""
    v1 = np.array(p1) - np.array(p2)
    v2 = np.array(p3) - np.array(p2)
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-6)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    angle_rad = np.arccos(cos_angle)
    return (angle_rad * 180.0) / np.pi  # Menggunakan derajat agar cocok dengan dataset Anda

def calculate_joint_angles(landmarks):
    """Mengekstrak 15 sudut sendi jari (3 sudut per jari * 5 jari)"""
    angles = []
    for finger, idx in FINGER_JOINTS.items():
        for i in range(1, 4):
            angles.append(calculate_angle(
                landmarks[idx[i - 1]],
                landmarks[idx[i]],
                landmarks[idx[i + 1]]
            ))
    return angles  # Panjang 15

def extract_hand_features(landmarks):
    """Mengekstrak 78 fitur (63 koordinat + 15 sudut) dari satu tangan"""
    coords = [(lm.x, lm.y, lm.z) for lm in landmarks]
    normalized_coords = normalize_landmarks(coords)
    joint_angles = calculate_joint_angles(coords)
    return normalized_coords + joint_angles

def build_feature_vector(results):
    """
    Menggabungkan fitur tangan kiri dan kanan menjadi vektor 156-dimensi.
    Jika salah satu tangan tidak terdeteksi, nilainya diisi nol.
    """
    left_features = [0.0] * 78
    right_features = [0.0] * 78

    if results.multi_hand_landmarks:
        for landmarks, handedness in zip(
            results.multi_hand_landmarks,
            results.multi_handedness
        ):
            label = handedness.classification[0].label  # "Left" / "Right"
            features = extract_hand_features(landmarks.landmark)
            if label == "Left":
                left_features = features
            else:
                right_features = features

    return left_features + right_features  # 156 fitur

def main():
    dataset_dir = "dataset"
    if not os.path.exists(dataset_dir):
        print(f"Folder '{dataset_dir}' tidak ditemukan. Silakan buat folder dan letakkan dataset Kaggle di sana.")
        return

    letters = [chr(c) for c in range(ord('A'), ord('Z') + 1)]
    samples = []

    print("Memulai ekstraksi fitur dataset...")
    for letter in tqdm(letters, desc="Memproses kelas"):
        folder = os.path.join(dataset_dir, letter)
        if not os.path.exists(folder):
            continue
            
        for filename in os.listdir(folder):
            path = os.path.join(folder, filename)
            image = cv2.imread(path)
            if image is None:
                continue
                
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = hands.process(image_rgb)

            if not results.multi_hand_landmarks:
                continue  # Skip jika tangan tidak terdeteksi

            features = build_feature_vector(results)
            samples.append({"features": features, "label": letter})

    print(f"\nTotal sampel yang berhasil diekstrak: {len(samples)}")
    if len(samples) == 0:
        return

    # Menyimpan data preprocessing dalam bentuk satu berkas json utuh
    output = {
        "version": "1.0",
        "feature_length": 156,
        "classes": letters,
        "samples": samples
    }

    output_path = "public/model-pretrained.json"
    print(f"Menyimpan hasil ke {output_path}...")
    with open(output_path, "w") as f:
        json.dump(output, f)
    print("Selesai!")

if __name__ == "__main__":
    main()
