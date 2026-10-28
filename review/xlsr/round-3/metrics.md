# xlsr metrics (31.29 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| x_intro | 62.2 | 138 | 133 / 154 | [147, 128, 142] |
| overview | 105.1 | 249 | 142 / 169 | [167, 136, 144, 145, 139, 147, 148] |
| tensors | 68.8 | 163 | 142 / 188 | [124, 155, 153, 170, 156, 119] |
| audio | 90.4 | 204 | 135 / 166 | [150, 127, 130, 166, 138, 135] |
| conv | 145.6 | 366 | 151 / 180 | [132, 161, 175, 130, 153, 157, 145, 165] |
| encoder | 175.2 | 402 | 138 / 164 | [165, 134, 126, 71, 164, 148, 134, 137, 136, 154] |
| projection | 139.7 | 336 | 144 / 172 | [147, 140, 148, 159, 153, 133, 147] |
| masking | 56.8 | 136 | 144 / 178 | [134, 155, 162, 147] |
| posconv | 118.4 | 290 | 147 / 171 | [148, 142, 150, 161, 147, 156] |
| attn | 97.8 | 249 | 153 / 192 | [138, 168, 161, 182, 155, 154, 143] |
| mha | 136.7 | 305 | 134 / 162 | [150, 135, 128, 136, 124, 126, 134, 143, 159] |
| x_layer | 102.6 | 237 | 139 / 164 | [148, 136, 146, 140, 142, 141] |
| outputs | 85.1 | 202 | 142 / 167 | [141, 159, 138, 156] |
| code | 70.4 | 165 | 141 / 166 | [138, 146, 152] |
| quant | 99.2 | 230 | 139 / 167 | [138, 141, 138, 158, 150, 140, 136] |
| contrast | 87.0 | 200 | 138 / 166 | [126, 151, 128, 151, 149, 144] |
| deepfake | 142.0 | 336 | 142 / 163 | [124, 148, 147, 146, 138, 154] |
| recap | 94.1 | 199 | 127 / 161 | [135, 138, 131, 145, 143] |

## Text on screen shorter than its reading time (26)
- [quant] 2.5 s (needs 4.4 s): no labels: the targets come from the audio itself
- [conv] 2.25 s (needs 3.5 s): −0.2×(1)  +  0.6×(0)  +  0.7×(−1)  =
- [quant] 0.75 s (needs 2.0 s): CHAPTER 14 / 17
- [conv] 2.5 s (needs 3.6 s): −0.3×(1)  +  −0.8×(0)  +  −0.2×(−1)  =
- [overview] 1.0 s (needs 2.0 s): CHAPTER 01 / 17
- [tensors] 1.0 s (needs 2.0 s): CHAPTER 02 / 17
- [audio] 1.0 s (needs 2.0 s): CHAPTER 03 / 17
- [conv] 1.0 s (needs 2.0 s): CHAPTER 04 / 17
- [encoder] 1.0 s (needs 2.0 s): CHAPTER 05 / 17
- [projection] 1.0 s (needs 2.0 s): CHAPTER 06 / 17
- [masking] 1.0 s (needs 2.0 s): CHAPTER 07 / 17
- [posconv] 1.0 s (needs 2.0 s): CHAPTER 08 / 17
- [attn] 1.0 s (needs 2.0 s): CHAPTER 09 / 17
- [mha] 1.0 s (needs 2.0 s): CHAPTER 10 / 17
- [x_layer] 1.0 s (needs 2.0 s): CHAPTER 11 / 17
- [outputs] 1.0 s (needs 2.0 s): CHAPTER 12 / 17
- [code] 1.0 s (needs 2.0 s): CHAPTER 13 / 17
- [contrast] 1.0 s (needs 2.0 s): CHAPTER 15 / 17
- [deepfake] 1.0 s (needs 2.0 s): CHAPTER 16 / 17
- [recap] 1.0 s (needs 2.0 s): CHAPTER 17 / 17
- [recap] 4.25 s (needs 5.1 s): The 201 frames become an image, two node sets, and a graph.
- [masking] 1.25 s (needs 1.9 s): (pre-training)
- [x_layer] 1.25 s (needs 1.6 s): (pre-norm)
- [encoder] 1.5 s (needs 1.8 s): convolutions
- [contrast] 1.5 s (needs 1.7 s): contrastive
- [quant] 3.25 s (needs 3.3 s): what the transformer must predict

## Message text under 20 px (7)
- [conv] 15 px: AFTER X[:, NONE]
- [encoder] 18 px: 400 samples = 25 ms
- [posconv] 18.72 px: weight-normalized
- [quant] 15 px: QUANTIZER BRANCH
- [contrast] 15 px: C = PROJECT_HID(H)
- [deepfake] 18.72 px: 24 layers · 1024
- [deepfake] 18.72 px: graph attention → score

## Dead stretches ≥ 6 s (90)
- [x_intro] from 11.75 s for 8.2 s
- [overview] from 65 s for 10.2 s
- [overview] from 76 s for 7.5 s
- [overview] from 83.75 s for 12.8 s
- [overview] from 97.25 s for 6.8 s
- [overview] from 137.25 s for 10.5 s
- [overview] from 148.25 s for 6.0 s
- [overview] from 158.25 s for 8.8 s
- [tensors] from 169 s for 6 s
- [tensors] from 175.25 s for 6.5 s
- [tensors] from 182.25 s for 7.0 s
- [tensors] from 227 s for 9 s
- [audio] from 240.25 s for 6.5 s
- [audio] from 247.25 s for 12.5 s
- [audio] from 264.75 s for 8.0 s
- [audio] from 300.25 s for 6.8 s
- [audio] from 308.75 s for 6.0 s
- [audio] from 315.5 s for 10.8 s
- [conv] from 332.25 s for 6.5 s
- [conv] from 340.25 s for 8.5 s
- [conv] from 350.5 s for 7.5 s
- [conv] from 370.25 s for 8.2 s
- [conv] from 378.75 s for 7.2 s
- [conv] from 397.75 s for 6.2 s
- [conv] from 410.75 s for 7.8 s
- [conv] from 425.75 s for 7.8 s
- [conv] from 433.75 s for 6.2 s
- [conv] from 458.25 s for 13.5 s
- [encoder] from 474.75 s for 27.2 s
- [encoder] from 502.75 s for 7.8 s
- [encoder] from 528.5 s for 10.2 s
- [encoder] from 539.5 s for 8.5 s
- [encoder] from 552 s for 9.2 s
- [encoder] from 571.75 s for 6.0 s
- [encoder] from 583.5 s for 8.2 s
- [encoder] from 592 s for 9 s
- [encoder] from 616.5 s for 12.2 s
- [encoder] from 629.5 s for 6.2 s
- [encoder] from 636 s for 11 s
- [projection] from 659.75 s for 9.5 s
- [projection] from 670.25 s for 9.0 s
- [projection] from 728 s for 9 s
- [projection] from 737.25 s for 8.8 s
- [projection] from 757.75 s for 6.8 s
- [projection] from 774.75 s for 11.0 s
- [masking] from 789.75 s for 8.5 s
- [masking] from 806.25 s for 6.2 s
- [masking] from 830 s for 13.5 s
- [posconv] from 867 s for 9.5 s
- [posconv] from 917 s for 6 s
- [posconv] from 926.25 s for 23.2 s
- [posconv] from 950 s for 12 s
- [attn] from 965 s for 18.2 s
- [attn] from 998.25 s for 7.0 s
- [attn] from 1035 s for 6.5 s
- [attn] from 1053.5 s for 6.2 s
- [mha] from 1062.75 s for 7.2 s
- [mha] from 1072.25 s for 7.2 s
- [mha] from 1083.75 s for 10.8 s
- [mha] from 1152 s for 7.8 s
- [mha] from 1169.5 s for 7.8 s
- [mha] from 1183 s for 13.5 s
- [x_layer] from 1266 s for 14.2 s
- [x_layer] from 1284.75 s for 14.2 s
- [outputs] from 1307.25 s for 12.0 s
- [outputs] from 1337 s for 6.8 s
- [outputs] from 1352.25 s for 9.8 s
- [outputs] from 1371.75 s for 12.5 s
- [code] from 1396.5 s for 8.2 s
- [code] from 1440 s for 14.8 s
- [quant] from 1460.25 s for 6.0 s
- [quant] from 1471.75 s for 9.5 s
- [quant] from 1485.75 s for 7.0 s
- [quant] from 1524.75 s for 6.5 s
- [quant] from 1531.5 s for 8.5 s
- [quant] from 1540.75 s for 13.0 s
- [contrast] from 1557 s for 13 s
- [contrast] from 1570.5 s for 10.0 s
- [contrast] from 1584.25 s for 6.2 s
- [contrast] from 1633.25 s for 7.5 s
- [deepfake] from 1644 s for 8.2 s
- [deepfake] from 1659 s for 8.8 s
- [deepfake] from 1677.5 s for 20.8 s
- [deepfake] from 1714 s for 12 s
- [deepfake] from 1735.25 s for 10.5 s
- [deepfake] from 1746 s for 7.8 s
- [deepfake] from 1757.75 s for 7.0 s
- [deepfake] from 1767 s for 16 s
- [recap] from 1792.5 s for 10.8 s
- [recap] from 1863.75 s for 8.0 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
