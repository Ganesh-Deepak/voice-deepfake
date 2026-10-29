# xlsr metrics (31.54 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| x_intro | 63.2 | 140 | 133 / 157 | [147, 128, 142] |
| overview | 105.9 | 249 | 141 / 169 | [156, 136, 144, 145, 139, 147, 148] |
| tensors | 69.8 | 163 | 140 / 188 | [124, 155, 153, 158, 156, 119] |
| audio | 91.4 | 204 | 134 / 166 | [150, 127, 130, 154, 138, 135] |
| conv | 148.8 | 366 | 148 / 180 | [132, 161, 158, 111, 153, 157, 145, 159] |
| encoder | 176.2 | 402 | 137 / 164 | [165, 134, 126, 71, 153, 148, 134, 137, 136, 154] |
| projection | 139.7 | 336 | 144 / 172 | [147, 140, 148, 159, 153, 133, 147] |
| masking | 57.8 | 136 | 141 / 178 | [134, 155, 152, 147] |
| posconv | 119.4 | 290 | 146 / 171 | [148, 142, 150, 154, 147, 156] |
| attn | 101.6 | 249 | 147 / 192 | [138, 161, 145, 160, 155, 154, 143] |
| mha | 136.7 | 305 | 134 / 162 | [150, 135, 128, 136, 124, 126, 134, 143, 159] |
| x_layer | 102.6 | 237 | 139 / 164 | [148, 136, 146, 140, 142, 141] |
| outputs | 85.7 | 204 | 143 / 167 | [141, 159, 140, 156] |
| code | 70.4 | 165 | 141 / 166 | [138, 146, 152] |
| quant | 99.2 | 230 | 139 / 167 | [138, 141, 138, 158, 150, 140, 136] |
| contrast | 87.0 | 200 | 138 / 166 | [126, 151, 128, 151, 149, 144] |
| deepfake | 142.0 | 336 | 142 / 163 | [124, 148, 147, 146, 138, 154] |
| recap | 95.1 | 199 | 126 / 161 | [135, 138, 131, 145, 143] |

## Text on screen shorter than its reading time (38)
- [conv] 2.25 s (needs 3.6 s): −0.3×(1)  +  −0.8×(0)  +  −0.2×(−1)  =
- [posconv] 0.25 s (needs 1.6 s): 10 outputs
- [posconv] 0.25 s (needs 1.6 s): 13 outputs
- [posconv] 0.25 s (needs 1.6 s): 16 outputs
- [posconv] 0.25 s (needs 1.6 s): 19 outputs
- [posconv] 0.25 s (needs 1.6 s): 22 outputs
- [posconv] 0.25 s (needs 1.6 s): 25 outputs
- [posconv] 0.25 s (needs 1.6 s): 28 outputs
- [posconv] 0.25 s (needs 1.6 s): 32 outputs
- [posconv] 0.25 s (needs 1.6 s): 35 outputs
- [posconv] 0.25 s (needs 1.6 s): 38 outputs
- [posconv] 0.25 s (needs 1.6 s): 41 outputs
- [posconv] 0.25 s (needs 1.6 s): 44 outputs
- [posconv] 0.25 s (needs 1.6 s): 47 outputs
- [audio] 0.75 s (needs 2.0 s): CHAPTER 03 / 17
- [attn] 0.75 s (needs 2.0 s): CHAPTER 09 / 17
- [recap] 0.75 s (needs 2.0 s): CHAPTER 17 / 17
- [overview] 1.0 s (needs 2.0 s): CHAPTER 01 / 17
- [tensors] 1.0 s (needs 2.0 s): CHAPTER 02 / 17
- [conv] 1.0 s (needs 2.0 s): CHAPTER 04 / 17
- [encoder] 1.0 s (needs 2.0 s): CHAPTER 05 / 17
- [projection] 1.0 s (needs 2.0 s): CHAPTER 06 / 17
- [masking] 1.0 s (needs 2.0 s): CHAPTER 07 / 17
- [posconv] 1.0 s (needs 2.0 s): CHAPTER 08 / 17
- [mha] 1.0 s (needs 2.0 s): CHAPTER 10 / 17
- [x_layer] 1.0 s (needs 2.0 s): CHAPTER 11 / 17
- [outputs] 1.0 s (needs 2.0 s): CHAPTER 12 / 17
- [code] 1.0 s (needs 2.0 s): CHAPTER 13 / 17
- [quant] 1.0 s (needs 2.0 s): CHAPTER 14 / 17
- [contrast] 1.0 s (needs 2.0 s): CHAPTER 15 / 17
- [deepfake] 1.0 s (needs 2.0 s): CHAPTER 16 / 17
- [masking] 1.25 s (needs 1.9 s): (pre-training)
- [encoder] 1.25 s (needs 1.8 s): convolutions
- [x_layer] 1.25 s (needs 1.6 s): (pre-norm)
- [contrast] 7.25 s (needs 7.5 s): dividing by a small κ = 0.1 makes the softmax sharp: the best match takes most o
- [contrast] 5.25 s (needs 5.5 s): L = − log  exp(sim(c,q_t)/κ) / Σ exp(sim(c,q̃)/κ)        κ = 0.1
- [contrast] 1.5 s (needs 1.7 s): contrastive
- [quant] 4.25 s (needs 4.4 s): no labels: the targets come from the audio itself

## Message text under 20 px (6)
- [encoder] 18 px: 400 samples = 25 ms
- [posconv] 18.72 px: 1024 → 1024 channels
- [quant] 18 px: temperature τ annealed
- [contrast] 17 px: C = PROJECT_HID(H)
- [deepfake] 18.72 px: 24 layers · 1024
- [deepfake] 18.72 px: graph attention → score

## Dead stretches ≥ 6 s (88)
- [x_intro] from 11.75 s for 8.2 s
- [overview] from 66 s for 11 s
- [overview] from 77.75 s for 7.8 s
- [overview] from 85.75 s for 12.5 s
- [overview] from 99 s for 6.8 s
- [overview] from 106.5 s for 8.2 s
- [overview] from 160 s for 9 s
- [tensors] from 170.75 s for 6.0 s
- [tensors] from 177 s for 6.5 s
- [tensors] from 184 s for 7 s
- [tensors] from 229.75 s for 9.0 s
- [audio] from 242.75 s for 6.8 s
- [audio] from 250 s for 13 s
- [audio] from 267.5 s for 8.0 s
- [audio] from 294 s for 9.5 s
- [audio] from 312.5 s for 6.0 s
- [audio] from 319.25 s for 10.8 s
- [conv] from 336.25 s for 6.2 s
- [conv] from 344 s for 8.5 s
- [conv] from 354.25 s for 8.8 s
- [conv] from 383.75 s for 8.0 s
- [conv] from 395.25 s for 6.5 s
- [conv] from 416.5 s for 7.8 s
- [conv] from 424.75 s for 6.5 s
- [conv] from 431.5 s for 14.2 s
- [conv] from 464.5 s for 14.2 s
- [encoder] from 481.75 s for 6.2 s
- [encoder] from 535.5 s for 11.2 s
- [encoder] from 559.5 s for 9.2 s
- [encoder] from 579.25 s for 6.0 s
- [encoder] from 591.5 s for 8.0 s
- [encoder] from 600 s for 8.8 s
- [encoder] from 610 s for 7 s
- [encoder] from 617.75 s for 6.0 s
- [encoder] from 624.5 s for 12.2 s
- [encoder] from 637.5 s for 6.2 s
- [encoder] from 644 s for 11 s
- [projection] from 667.75 s for 9.5 s
- [projection] from 678.25 s for 9.0 s
- [projection] from 736 s for 9 s
- [projection] from 745.25 s for 8.8 s
- [projection] from 765.75 s for 6.8 s
- [projection] from 782.5 s for 12.2 s
- [masking] from 797.75 s for 8.5 s
- [masking] from 842 s for 6.8 s
- [posconv] from 876.25 s for 9.0 s
- [posconv] from 886 s for 6.8 s
- [posconv] from 917 s for 6 s
- [posconv] from 926.5 s for 6.2 s
- [posconv] from 944.25 s for 9.5 s
- [posconv] from 960 s for 12 s
- [attn] from 974.75 s for 9.5 s
- [attn] from 1048.75 s for 6.8 s
- [attn] from 1067.25 s for 6.2 s
- [mha] from 1076.5 s for 7.2 s
- [mha] from 1086 s for 7.2 s
- [mha] from 1165.75 s for 7.8 s
- [mha] from 1201.75 s for 8.5 s
- [x_layer] from 1230.25 s for 6.2 s
- [x_layer] from 1246.25 s for 6.5 s
- [x_layer] from 1273.25 s for 7.5 s
- [x_layer] from 1281.25 s for 7.8 s
- [x_layer] from 1300.5 s for 12.5 s
- [outputs] from 1321 s for 12 s
- [outputs] from 1387 s for 11.2 s
- [code] from 1410.75 s for 8.2 s
- [code] from 1454.25 s for 14.8 s
- [quant] from 1486.5 s for 8.8 s
- [quant] from 1499.25 s for 10.5 s
- [quant] from 1510.25 s for 7.8 s
- [quant] from 1519.25 s for 7.8 s
- [quant] from 1542.5 s for 12.0 s
- [quant] from 1559 s for 9.2 s
- [contrast] from 1572.75 s for 11.5 s
- [contrast] from 1584.75 s for 7.5 s
- [contrast] from 1598.5 s for 6.2 s
- [contrast] from 1622.75 s for 10.5 s
- [contrast] from 1647.75 s for 7.5 s
- [deepfake] from 1658.25 s for 8.2 s
- [deepfake] from 1673.25 s for 8.8 s
- [deepfake] from 1696 s for 14.2 s
- [deepfake] from 1710.75 s for 7.2 s
- [deepfake] from 1733.5 s for 6.8 s
- [deepfake] from 1749.75 s for 10.2 s
- [deepfake] from 1760.25 s for 7.8 s
- [deepfake] from 1775 s for 6.8 s
- [recap] from 1806.75 s for 10.8 s
- [recap] from 1879 s for 7 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
