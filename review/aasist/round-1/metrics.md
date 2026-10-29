# aasist metrics (17.0 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| a_intro | 49.5 | 111 | 135 / 161 | [135, 127, 166] |
| a_overview | 74.0 | 164 | 133 / 160 | [128, 145, 107, 159, 153, 132] |
| a_start | 73.9 | 176 | 143 / 169 | [149, 143, 162, 135] |
| a_image | 90.8 | 209 | 138 / 165 | [161, 146, 148, 130, 131] |
| a_conv2d | 73.2 | 167 | 137 / 165 | [147, 142, 141, 140] |
| a_res | 75.0 | 186 | 149 / 177 | [158, 140, 165, 152] |
| a_nodes | 83.6 | 183 | 131 / 157 | [146, 144, 135, 130, 123] |
| a_gat | 85.2 | 208 | 147 / 177 | [141, 147, 172, 164, 150, 136] |
| a_pool | 37.8 | 85 | 135 / 173 | [165, 140, 132] |
| a_hsgal | 76.3 | 175 | 138 / 162 | [121, 143, 148, 146, 148] |
| a_branch | 47.2 | 103 | 131 / 161 | [115, 136, 154] |
| a_readout | 59.8 | 142 | 142 / 175 | [151, 145, 157, 141] |
| a_orig | 74.9 | 169 | 135 / 159 | [128, 148, 151, 139] |
| a_code | 43.5 | 102 | 141 / 174 | [157, 139, 153] |
| a_recap | 75.6 | 156 | 124 / 158 | [115, 141, 126, 152, 146] |

## Text on screen shorter than its reading time (17)
- [a_image] 0.75 s (needs 2.0 s): CHAPTER 03 / 14
- [a_overview] 1.0 s (needs 2.0 s): CHAPTER 01 / 14
- [a_start] 1.0 s (needs 2.0 s): CHAPTER 02 / 14
- [a_conv2d] 1.0 s (needs 2.0 s): CHAPTER 04 / 14
- [a_res] 1.0 s (needs 2.0 s): CHAPTER 05 / 14
- [a_nodes] 1.0 s (needs 2.0 s): CHAPTER 06 / 14
- [a_gat] 1.0 s (needs 2.0 s): CHAPTER 07 / 14
- [a_pool] 1.0 s (needs 2.0 s): CHAPTER 08 / 14
- [a_hsgal] 1.0 s (needs 2.0 s): CHAPTER 09 / 14
- [a_branch] 1.0 s (needs 2.0 s): CHAPTER 10 / 14
- [a_readout] 1.0 s (needs 2.0 s): CHAPTER 11 / 14
- [a_orig] 1.0 s (needs 2.0 s): CHAPTER 12 / 14
- [a_code] 1.0 s (needs 2.0 s): CHAPTER 13 / 14
- [a_recap] 1.0 s (needs 2.0 s): CHAPTER 14 / 14
- [a_recap] 4.5 s (needs 5.3 s): Bidirectional state space models (Hydra) mixed with attention.
- [a_conv2d] 1.25 s (needs 1.7 s): convolution
- [a_orig] 1.5 s (needs 1.6 s): comparison

## Message text under 20 px (10)
- [a_overview] 18 px: frames × features
- [a_overview] 18 px: 6 residual blocks
- [a_overview] 18 px: spectral + temporal
- [a_overview] 18 px: GAT, pool, HS-GAL ×2
- [a_overview] 18 px: max, mean → Linear
- [a_start] 18.72 px: 24 layers · hidden 1024
- [a_nodes] 17.28 px: SELU · BN · 1×1 conv 128→64
- [a_hsgal] 18.72 px: → BN → SELU (64 → 32)
- [a_branch] 18.72 px: 32 → 32, + residual
- [a_orig] 15 px: ORIGINAL AASIST

## Dead stretches ≥ 6 s (53)
- [a_intro] from 40.5 s for 8.8 s
- [a_overview] from 52 s for 10.8 s
- [a_overview] from 66.25 s for 8.5 s
- [a_overview] from 75.5 s for 6.0 s
- [a_overview] from 82 s for 10.5 s
- [a_overview] from 93 s for 9.2 s
- [a_overview] from 103.25 s for 7.8 s
- [a_overview] from 112.5 s for 10.8 s
- [a_start] from 131 s for 9 s
- [a_start] from 169.5 s for 13.0 s
- [a_start] from 183 s for 14.2 s
- [a_image] from 206.25 s for 8.8 s
- [a_image] from 215.75 s for 9.2 s
- [a_image] from 244.5 s for 6.0 s
- [a_image] from 254.5 s for 9.8 s
- [a_image] from 267.25 s for 11.0 s
- [a_image] from 278.5 s for 9.5 s
- [a_conv2d] from 333 s for 15.2 s
- [a_conv2d] from 348.75 s for 6.5 s
- [a_res] from 366.5 s for 15.5 s
- [a_res] from 390.5 s for 6.0 s
- [a_res] from 406.25 s for 6.2 s
- [a_res] from 414.5 s for 6.0 s
- [a_res] from 427.5 s for 8.8 s
- [a_nodes] from 439.25 s for 18.5 s
- [a_nodes] from 464 s for 8.8 s
- [a_nodes] from 498 s for 7.5 s
- [a_nodes] from 510 s for 9.8 s
- [a_gat] from 524.25 s for 10.2 s
- [a_gat] from 535.25 s for 6.5 s
- [a_gat] from 542 s for 11.2 s
- [a_gat] from 579.5 s for 7.2 s
- [a_gat] from 587 s for 7.8 s
- [a_gat] from 595.75 s for 9.2 s
- [a_pool] from 610.5 s for 6.2 s
- [a_pool] from 628.25 s for 6.0 s
- [a_pool] from 635.25 s for 7.5 s
- [a_hsgal] from 645.75 s for 9.8 s
- [a_hsgal] from 663.5 s for 6.5 s
- [a_hsgal] from 703.5 s for 15.5 s
- [a_branch] from 725 s for 7.2 s
- [a_branch] from 758 s for 8.2 s
- [a_readout] from 772 s for 9.8 s
- [a_readout] from 801.25 s for 12.2 s
- [a_readout] from 813.75 s for 12.2 s
- [a_orig] from 831.25 s for 17.8 s
- [a_orig] from 852.5 s for 11.0 s
- [a_orig] from 877.25 s for 6.2 s
- [a_orig] from 887.25 s for 6.0 s
- [a_orig] from 893.5 s for 7.5 s
- [a_code] from 903 s for 19.5 s
- [a_code] from 936.75 s for 7.8 s
- [a_recap] from 998.75 s for 16.0 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
