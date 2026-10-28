# w2v2 metrics (27.85 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| intro | 40.5 | 107 | 159 / 183 | [163, 128, 206] |
| overview | 92.2 | 228 | 148 / 166 | [178, 140, 133, 161, 146, 157, 157] |
| tensors | 62.9 | 164 | 156 / 187 | [148, 181, 176, 183, 166, 129] |
| audio | 81.0 | 199 | 147 / 169 | [166, 136, 141, 179, 156, 142] |
| conv | 128.6 | 349 | 163 / 184 | [145, 178, 196, 151, 164, 167, 156, 173] |
| encoder | 161.5 | 399 | 148 / 166 | [181, 144, 135, 82, 175, 155, 143, 144, 149, 163] |
| projection | 129.8 | 333 | 154 / 173 | [158, 153, 157, 174, 157, 141, 161] |
| masking | 52.8 | 136 | 155 / 178 | [145, 167, 173, 158] |
| posconv | 100.9 | 261 | 155 / 173 | [161, 144, 156, 173, 157, 168] |
| attn | 91.1 | 250 | 165 / 190 | [154, 181, 174, 201, 160, 165, 153] |
| mha | 124.9 | 297 | 143 / 161 | [170, 143, 139, 149, 131, 135, 144, 156, 161] |
| layer | 96.4 | 232 | 144 / 162 | [180, 151, 141, 158, 136, 151] |
| outputs | 71.9 | 176 | 147 / 165 | [144, 177, 147, 148] |
| code | 56.0 | 140 | 150 / 172 | [163, 153, 158] |
| quant | 91.8 | 229 | 150 / 168 | [145, 150, 162, 169, 159, 151, 145] |
| contrast | 78.3 | 194 | 149 / 168 | [140, 163, 138, 161, 159, 154] |
| deepfake | 135.4 | 343 | 152 / 167 | [136, 152, 154, 157, 152, 166] |
| recap | 75.0 | 167 | 134 / 164 | [163, 138, 141, 165, 158] |

## Text on screen shorter than its reading time (25)
- [conv] 1.0 s (needs 3.6 s): −0.3×(1)  +  −0.8×(0)  +  −0.2×(−1)  =
- [tensors] 0.75 s (needs 2.0 s): CHAPTER 02 / 17
- [mha] 3.75 s (needs 5.0 s): attention weights: 4 × (768×768 + 768) ≈ 2.36 M per layer
- [overview] 1.0 s (needs 2.0 s): CHAPTER 01 / 17
- [audio] 1.0 s (needs 2.0 s): CHAPTER 03 / 17
- [conv] 1.0 s (needs 2.0 s): CHAPTER 04 / 17
- [encoder] 1.0 s (needs 2.0 s): CHAPTER 05 / 17
- [projection] 1.0 s (needs 2.0 s): CHAPTER 06 / 17
- [masking] 1.0 s (needs 2.0 s): CHAPTER 07 / 17
- [posconv] 1.0 s (needs 2.0 s): CHAPTER 08 / 17
- [attn] 1.0 s (needs 2.0 s): CHAPTER 09 / 17
- [mha] 1.0 s (needs 2.0 s): CHAPTER 10 / 17
- [layer] 1.0 s (needs 2.0 s): CHAPTER 11 / 17
- [outputs] 1.0 s (needs 2.0 s): CHAPTER 12 / 17
- [code] 1.0 s (needs 2.0 s): CHAPTER 13 / 17
- [quant] 1.0 s (needs 2.0 s): CHAPTER 14 / 17
- [contrast] 1.0 s (needs 2.0 s): CHAPTER 15 / 17
- [deepfake] 1.0 s (needs 2.0 s): CHAPTER 16 / 17
- [recap] 1.0 s (needs 2.0 s): CHAPTER 17 / 17
- [recap] 4.5 s (needs 5.4 s): XLS-R features as an image, two node sets, and graph attention.
- [encoder] 1.25 s (needs 1.8 s): convolutions
- [conv] 3.0 s (needs 3.5 s): −0.2×(1)  +  0.6×(0)  +  0.7×(−1)  =
- [masking] 1.5 s (needs 1.9 s): (pre-training)
- [contrast] 5.25 s (needs 5.5 s): L = − log  exp(sim(c,q_t)/κ) / Σ exp(sim(c,q̃)/κ)        κ = 0.1
- [contrast] 1.5 s (needs 1.7 s): contrastive

## Message text under 20 px (7)
- [conv] 18 px: after x[:, None]
- [encoder] 18 px: 400 samples = 25 ms
- [posconv] 18.72 px: weight-normalized
- [quant] 18 px: quantizer branch
- [contrast] 18 px: c = project_hid(h)
- [deepfake] 18.72 px: 24 layers · 1024
- [deepfake] 18.72 px: graph attention → score

## Dead stretches ≥ 6 s (70)
- [intro] from 31.75 s for 8.5 s
- [overview] from 49 s for 6 s
- [overview] from 55.5 s for 9.5 s
- [overview] from 82.75 s for 6.0 s
- [overview] from 91.25 s for 11.8 s
- [overview] from 104.25 s for 8.8 s
- [overview] from 114.75 s for 6.5 s
- [tensors] from 176 s for 6.2 s
- [tensors] from 185.75 s for 9.5 s
- [audio] from 251 s for 6 s
- [conv] from 281.75 s for 6.0 s
- [conv] from 288 s for 7 s
- [conv] from 298.25 s for 6.8 s
- [conv] from 319.5 s for 9.5 s
- [conv] from 353.5 s for 13.5 s
- [conv] from 367.25 s for 9.0 s
- [conv] from 392.75 s for 8.2 s
- [encoder] from 415.5 s for 8.2 s
- [encoder] from 425.5 s for 12.2 s
- [encoder] from 439.5 s for 6.2 s
- [encoder] from 456.5 s for 6.5 s
- [encoder] from 466.75 s for 6.2 s
- [encoder] from 479 s for 8 s
- [encoder] from 497.5 s for 7.2 s
- [encoder] from 559.5 s for 7.0 s
- [projection] from 641.75 s for 13.2 s
- [projection] from 670.5 s for 6.5 s
- [projection] from 689.5 s for 6.8 s
- [masking] from 714.25 s for 6.0 s
- [masking] from 737.5 s for 11.8 s
- [posconv] from 768.75 s for 6.2 s
- [posconv] from 788 s for 11 s
- [posconv] from 810.75 s for 10.8 s
- [posconv] from 824.75 s for 8.2 s
- [posconv] from 839 s for 8 s
- [attn] from 857.5 s for 6.8 s
- [attn] from 883.75 s for 6.0 s
- [attn] from 905.5 s for 7.8 s
- [attn] from 935.25 s for 6.0 s
- [mha] from 943.75 s for 6.5 s
- [mha] from 967.5 s for 6.2 s
- [mha] from 977.5 s for 8.5 s
- [mha] from 1056.25 s for 6.8 s
- [layer] from 1074.75 s for 7.5 s
- [layer] from 1145.5 s for 13.5 s
- [outputs] from 1170 s for 7.5 s
- [outputs] from 1183.75 s for 7.0 s
- [outputs] from 1207.75 s for 7.8 s
- [code] from 1241.25 s for 8.2 s
- [code] from 1249.75 s for 7.0 s
- [code] from 1260 s for 10 s
- [code] from 1280.25 s for 10.0 s
- [quant] from 1292.75 s for 10.2 s
- [quant] from 1306.5 s for 6.5 s
- [quant] from 1342.25 s for 6.5 s
- [quant] from 1355 s for 6 s
- [quant] from 1361.5 s for 7.8 s
- [quant] from 1375.5 s for 6.5 s
- [contrast] from 1385.5 s for 11.0 s
- [contrast] from 1399.5 s for 6.8 s
- [deepfake] from 1463 s for 7.5 s
- [deepfake] from 1495.5 s for 9.5 s
- [deepfake] from 1505.5 s for 9.8 s
- [deepfake] from 1529.5 s for 8.0 s
- [deepfake] from 1546.25 s for 6.8 s
- [deepfake] from 1553.5 s for 6.8 s
- [deepfake] from 1560.5 s for 6.5 s
- [deepfake] from 1571 s for 6 s
- [deepfake] from 1582.75 s for 8.2 s
- [recap] from 1605.75 s for 9.2 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
