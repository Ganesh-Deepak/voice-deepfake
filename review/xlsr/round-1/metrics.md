# xlsr metrics (22.18 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| x_intro | 60.4 | 141 | 140 / 155 | [157, 133, 150] |
| x_overview | 73.9 | 184 | 149 / 168 | [157, 148, 163, 160, 146, 158] |
| x_tensors | 57.7 | 156 | 162 / 190 | [174, 179, 170, 157] |
| x_audio | 68.2 | 162 | 143 / 159 | [149, 141, 156, 143] |
| x_conv | 86.2 | 223 | 155 / 173 | [152, 173, 159, 152, 163] |
| x_encoder | 102.6 | 252 | 147 / 164 | [150, 154, 181, 142, 138, 158] |
| x_project | 80.8 | 210 | 156 / 173 | [162, 159, 165, 156] |
| x_mask | 39.7 | 107 | 162 / 188 | [182, 165] |
| x_posconv | 77.0 | 197 | 154 / 171 | [140, 168, 168, 159] |
| x_attn | 68.6 | 190 | 166 / 191 | [152, 183, 187, 175, 155] |
| x_mha | 94.3 | 244 | 155 / 170 | [155, 145, 179, 152, 166] |
| x_layer | 79.4 | 197 | 149 / 168 | [162, 150, 153, 157, 150] |
| x_stack | 65.4 | 164 | 150 / 170 | [146, 154, 173, 151] |
| x_budget | 30.5 | 78 | 153 / 177 | [157, 179] |
| x_quant | 66.7 | 166 | 149 / 167 | [152, 148, 154, 163] |
| x_contrast | 68.6 | 168 | 147 / 164 | [141, 162, 162, 143] |
| x_detect | 82.3 | 203 | 148 / 165 | [154, 151, 145, 150, 160] |
| x_code | 61.5 | 164 | 160 / 179 | [159, 178, 159] |
| x_recap | 66.8 | 153 | 137 / 166 | [146, 159, 148, 158] |

## Text on screen shorter than its reading time (48)
- [x_code] 0.25 s (needs 2.1 s): transformers impo
- [x_stack] 0.25 s (needs 1.8 s): layer 1 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 3 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 4 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 6 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 7 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 9 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 11 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 12 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 14 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 15 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 17 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 18 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 20 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 21 / 24
- [x_stack] 0.25 s (needs 1.8 s): layer 23 / 24
- [x_stack] 0.5 s (needs 1.8 s): layer 2 / 24
- [x_stack] 0.5 s (needs 1.8 s): layer 5 / 24
- [x_stack] 0.5 s (needs 1.8 s): layer 8 / 24
- [x_stack] 0.5 s (needs 1.8 s): layer 10 / 24
- [x_stack] 0.5 s (needs 1.8 s): layer 13 / 24
- [x_stack] 0.5 s (needs 1.8 s): layer 16 / 24
- [x_stack] 0.5 s (needs 1.8 s): layer 19 / 24
- [x_stack] 0.5 s (needs 1.8 s): layer 22 / 24
- [x_stack] 0.5 s (needs 1.8 s): layer 24 / 24
- [x_overview] 0.75 s (needs 2.0 s): CHAPTER 01 / 18
- [x_posconv] 2.75 s (needs 4.0 s): shuffled frames: attention would not notice
- [x_contrast] 0.75 s (needs 2.0 s): CHAPTER 15 / 18
- [x_tensors] 1.0 s (needs 2.0 s): CHAPTER 02 / 18
- [x_audio] 1.0 s (needs 2.0 s): CHAPTER 03 / 18
- [x_conv] 1.0 s (needs 2.0 s): CHAPTER 04 / 18
- [x_encoder] 1.0 s (needs 2.0 s): CHAPTER 05 / 18
- [x_project] 1.0 s (needs 2.0 s): CHAPTER 06 / 18
- [x_mask] 1.0 s (needs 2.0 s): CHAPTER 07 / 18
- [x_posconv] 1.0 s (needs 2.0 s): CHAPTER 08 / 18
- [x_attn] 1.0 s (needs 2.0 s): CHAPTER 09 / 18
- [x_mha] 1.0 s (needs 2.0 s): CHAPTER 10 / 18
- [x_layer] 1.0 s (needs 2.0 s): CHAPTER 11 / 18
- [x_stack] 1.0 s (needs 2.0 s): CHAPTER 12 / 18
- [x_budget] 1.0 s (needs 2.0 s): CHAPTER 13 / 18

## Message text under 20 px (9)
- [x_overview] 18 px: 128-frame window
- [x_overview] 15 px: PRE-TRAINING BRANCH
- [x_posconv] 18 px: (8,388,608 + bias + weight-norm gain)
- [x_stack] 15 px: ALL HIDDEN STATES
- [x_stack] 18 px: El Kheir et al., 2025 (layer-wise analysis)
- [x_stack] 17 px: colours: illustration, not measured weights
- [x_quant] 15 px: QUANTIZER BRANCH
- [x_quant] 18 px: group 1: 320 scores
- [x_quant] 18 px: group 2: 320 scores

## Dead stretches ≥ 6 s (47)
- [x_intro] from 11.25 s for 8.5 s
- [x_overview] from 75 s for 11.8 s
- [x_overview] from 114.5 s for 6.0 s
- [x_overview] from 123.75 s for 10.2 s
- [x_tensors] from 168.75 s for 7.8 s
- [x_tensors] from 179.75 s for 12.0 s
- [x_audio] from 198.75 s for 6.8 s
- [x_audio] from 247 s for 13 s
- [x_conv] from 265.25 s for 6.5 s
- [x_conv] from 276.25 s for 8.2 s
- [x_conv] from 287.5 s for 13.0 s
- [x_encoder] from 351.5 s for 9.5 s
- [x_encoder] from 372.75 s for 8.8 s
- [x_encoder] from 418 s for 15.5 s
- [x_encoder] from 435.5 s for 13.2 s
- [x_project] from 452.75 s for 11.2 s
- [x_project] from 496 s for 6 s
- [x_project] from 510.25 s for 19.5 s
- [x_mask] from 559 s for 10.2 s
- [x_posconv] from 577.25 s for 12.0 s
- [x_posconv] from 615.25 s for 9.2 s
- [x_posconv] from 630 s for 16.2 s
- [x_attn] from 649.75 s for 7.2 s
- [x_attn] from 660.5 s for 8.2 s
- [x_attn] from 688.5 s for 7.8 s
- [x_attn] from 704 s for 10.8 s
- [x_mha] from 721.5 s for 9.8 s
- [x_mha] from 737.75 s for 15.0 s
- [x_mha] from 779.75 s for 10.0 s
- [x_mha] from 796.5 s for 12.8 s
- [x_layer] from 812 s for 10.8 s
- [x_layer] from 875 s for 13.5 s
- [x_stack] from 905.75 s for 11.2 s
- [x_stack] from 942.5 s for 11.5 s
- [x_budget] from 977 s for 7.5 s
- [x_quant] from 989.75 s for 12.8 s
- [x_quant] from 1004 s for 7.8 s
- [x_quant] from 1038.75 s for 12.5 s
- [x_contrast] from 1058.5 s for 14.2 s
- [x_contrast] from 1097.25 s for 10.0 s
- [x_detect] from 1143 s for 11.5 s
- [x_detect] from 1172.5 s for 11.2 s
- [x_detect] from 1190.25 s for 11.8 s
- [x_code] from 1208 s for 13 s
- [x_code] from 1245.5 s for 18.0 s
- [x_recap] from 1276.75 s for 7.8 s
- [x_recap] from 1313.25 s for 11.8 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
