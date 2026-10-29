# xlsr metrics (31.49 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| x_intro | 62.2 | 138 | 133 / 154 | [147, 128, 142] |
| overview | 105.9 | 249 | 141 / 169 | [156, 136, 144, 145, 139, 147, 148] |
| tensors | 69.8 | 163 | 140 / 188 | [124, 155, 153, 158, 156, 119] |
| audio | 91.4 | 204 | 134 / 166 | [150, 127, 130, 154, 138, 135] |
| conv | 147.8 | 366 | 149 / 180 | [132, 161, 158, 130, 153, 157, 145, 159] |
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
| recap | 94.1 | 199 | 127 / 161 | [135, 138, 131, 145, 143] |

## Text on screen shorter than its reading time (26)
- [audio] 0.75 s (needs 2.0 s): CHAPTER 03 / 17
- [outputs] 0.75 s (needs 2.0 s): CHAPTER 12 / 17
- [contrast] 0.75 s (needs 2.0 s): CHAPTER 15 / 17
- [deepfake] 0.75 s (needs 2.0 s): CHAPTER 16 / 17
- [overview] 1.0 s (needs 2.0 s): CHAPTER 01 / 17
- [tensors] 1.0 s (needs 2.0 s): CHAPTER 02 / 17
- [conv] 1.0 s (needs 2.0 s): CHAPTER 04 / 17
- [encoder] 1.0 s (needs 2.0 s): CHAPTER 05 / 17
- [projection] 1.0 s (needs 2.0 s): CHAPTER 06 / 17
- [masking] 1.0 s (needs 2.0 s): CHAPTER 07 / 17
- [posconv] 1.0 s (needs 2.0 s): CHAPTER 08 / 17
- [attn] 1.0 s (needs 2.0 s): CHAPTER 09 / 17
- [mha] 1.0 s (needs 2.0 s): CHAPTER 10 / 17
- [x_layer] 1.0 s (needs 2.0 s): CHAPTER 11 / 17
- [code] 1.0 s (needs 2.0 s): CHAPTER 13 / 17
- [quant] 1.0 s (needs 2.0 s): CHAPTER 14 / 17
- [recap] 1.0 s (needs 2.0 s): CHAPTER 17 / 17
- [recap] 4.25 s (needs 5.1 s): The 201 frames become an image, two node sets, and a graph.
- [masking] 1.25 s (needs 1.9 s): (pre-training)
- [x_layer] 2.5 s (needs 3.0 s): pre-norm: LN before each part
- [contrast] 1.25 s (needs 1.7 s): contrastive
- [x_layer] 1.25 s (needs 1.6 s): (pre-norm)
- [encoder] 1.5 s (needs 1.8 s): convolutions
- [quant] 4.25 s (needs 4.4 s): no labels: the targets come from the audio itself
- [conv] 3.5 s (needs 3.6 s): −0.3×(1)  +  −0.8×(0)  +  −0.2×(−1)  =
- [recap] 3.5 s (needs 3.6 s): ganesh-deepak.github.io/voice-deepfake

## Message text under 20 px (7)
- [encoder] 18 px: 400 samples = 25 ms
- [posconv] 18.72 px: 1024 → 1024 channels
- [quant] 15 px: QUANTIZER BRANCH
- [quant] 18 px: temperature τ annealed
- [contrast] 15 px: C = PROJECT_HID(H)
- [deepfake] 18.72 px: 24 layers · 1024
- [deepfake] 18.72 px: graph attention → score

## Dead stretches ≥ 6 s (83)
- [x_intro] from 11.75 s for 8.2 s
- [overview] from 65 s for 11 s
- [overview] from 77 s for 7.5 s
- [overview] from 84.75 s for 12.5 s
- [overview] from 98 s for 6.8 s
- [overview] from 105.5 s for 8.2 s
- [overview] from 159 s for 9 s
- [tensors] from 169.75 s for 6.0 s
- [tensors] from 176 s for 6.5 s
- [tensors] from 183.25 s for 6.8 s
- [tensors] from 229 s for 8.8 s
- [audio] from 242 s for 6.8 s
- [audio] from 249 s for 13 s
- [audio] from 266.5 s for 8.0 s
- [audio] from 302.75 s for 7.0 s
- [audio] from 311.5 s for 6.0 s
- [audio] from 318.25 s for 10.8 s
- [conv] from 335.25 s for 6.2 s
- [conv] from 343 s for 8.5 s
- [conv] from 353.5 s for 8.2 s
- [conv] from 382.25 s for 7.5 s
- [conv] from 400 s for 7.8 s
- [conv] from 414.75 s for 7.5 s
- [conv] from 422.75 s for 6.5 s
- [conv] from 429.5 s for 7.8 s
- [conv] from 437.5 s for 6.2 s
- [conv] from 462.5 s for 14.2 s
- [encoder] from 488 s for 13.2 s
- [encoder] from 533.5 s for 11.2 s
- [encoder] from 557.5 s for 9.2 s
- [encoder] from 577.25 s for 6.0 s
- [encoder] from 589.5 s for 8.2 s
- [encoder] from 598 s for 8.8 s
- [encoder] from 622.5 s for 12.2 s
- [encoder] from 635.5 s for 6.2 s
- [encoder] from 642 s for 11 s
- [projection] from 665.75 s for 9.5 s
- [projection] from 676.25 s for 9.0 s
- [projection] from 734 s for 9 s
- [projection] from 743.25 s for 8.8 s
- [projection] from 763.75 s for 6.8 s
- [projection] from 780.75 s for 12.0 s
- [masking] from 795.75 s for 8.5 s
- [masking] from 840 s for 6.8 s
- [posconv] from 874.25 s for 9.2 s
- [posconv] from 915 s for 6 s
- [posconv] from 924.5 s for 6.5 s
- [posconv] from 942.25 s for 9.5 s
- [posconv] from 958.25 s for 11.8 s
- [attn] from 973 s for 9.2 s
- [attn] from 1046.75 s for 6.8 s
- [attn] from 1065.25 s for 6.2 s
- [mha] from 1074.5 s for 7.2 s
- [mha] from 1084 s for 7.2 s
- [mha] from 1163.75 s for 7.8 s
- [mha] from 1194.75 s for 13.5 s
- [x_layer] from 1243.25 s for 6.5 s
- [x_layer] from 1277.75 s for 14.2 s
- [x_layer] from 1298.5 s for 12.5 s
- [outputs] from 1319 s for 12 s
- [outputs] from 1384 s for 12.5 s
- [code] from 1408.75 s for 8.2 s
- [code] from 1452.25 s for 14.8 s
- [quant] from 1484.5 s for 8.8 s
- [quant] from 1497.25 s for 10.2 s
- [quant] from 1508.5 s for 16.5 s
- [quant] from 1545.25 s for 7.2 s
- [quant] from 1557.25 s for 9.0 s
- [contrast] from 1569.25 s for 13.0 s
- [contrast] from 1583 s for 7.2 s
- [contrast] from 1596.5 s for 6.2 s
- [contrast] from 1645.75 s for 7.5 s
- [deepfake] from 1656.25 s for 8.5 s
- [deepfake] from 1671.25 s for 9.0 s
- [deepfake] from 1680.75 s for 11.0 s
- [deepfake] from 1694 s for 10 s
- [deepfake] from 1708.75 s for 7.2 s
- [deepfake] from 1731.5 s for 6.8 s
- [deepfake] from 1747.75 s for 10.2 s
- [deepfake] from 1758.25 s for 7.8 s
- [deepfake] from 1773 s for 6.8 s
- [recap] from 1804.75 s for 10.8 s
- [recap] from 1876 s for 8 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
