import numpy as np
import os

# 🔹 데이터 불러오기
action = "테스트5"  # 확인할 동작 라벨
data_path = os.path.join("dataset", action, "data.npy")

if not os.path.exists(data_path):
    print(f"❌ 데이터 파일이 없습니다: {data_path}")
    exit()

data = np.load(data_path, allow_pickle=True)

# 🔹 데이터 개수 확인
print(f"✅ 불러온 데이터 개수: {len(data)}")

# 🔹 287번째 데이터 출력
index = 287
if index < len(data):
    print(f"\n▶ 287번째 데이터 (30프레임 * 147개 좌표):")
    print(data[index])  # 배열 출력
else:
    print(f"❌ 287번째 데이터가 없습니다. 총 데이터 개수: {len(data)}")
