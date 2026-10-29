# aasist metrics (17.34 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| a_intro | 54.8 | 121 | 132 / 160 | [135, 128, 157] |
| a_overview | 74.0 | 164 | 133 / 160 | [128, 145, 107, 159, 153, 132] |
| a_start | 74.9 | 176 | 141 / 169 | [149, 143, 156, 135] |
| a_image | 91.8 | 209 | 137 / 165 | [152, 146, 148, 130, 131] |
| a_conv2d | 73.2 | 167 | 137 / 165 | [147, 142, 141, 140] |
| a_res | 76.0 | 186 | 147 / 177 | [158, 140, 158, 152] |
| a_nodes | 83.6 | 183 | 131 / 157 | [146, 144, 135, 130, 123] |
| a_gat | 87.4 | 208 | 143 / 177 | [141, 147, 157, 152, 150, 136] |
| a_pool | 38.8 | 85 | 132 / 173 | [151, 140, 132] |
| a_hsgal | 76.8 | 176 | 138 / 163 | [121, 143, 148, 146, 147] |
| a_branch | 47.2 | 103 | 131 / 161 | [115, 136, 154] |
| a_readout | 66.7 | 154 | 138 / 171 | [151, 145, 144, 141] |
| a_orig | 74.9 | 169 | 135 / 159 | [128, 148, 151, 139] |
| a_code | 43.5 | 102 | 141 / 174 | [157, 139, 153] |
| a_recap | 76.6 | 156 | 122 / 158 | [115, 141, 126, 152, 146] |

## Text on screen shorter than its reading time (23)
- [a_gat] 0.75 s (needs 2.0 s): CHAPTER 07 / 14
- [a_code] 0.75 s (needs 2.0 s): CHAPTER 13 / 14
- [a_recap] 0.75 s (needs 2.0 s): CHAPTER 14 / 14
- [a_image] 2.75 s (needs 3.8 s): each pooled cell covers 3 frames = 60 ms
- [a_overview] 1.0 s (needs 2.0 s): CHAPTER 01 / 14
- [a_start] 1.0 s (needs 2.0 s): CHAPTER 02 / 14
- [a_image] 1.0 s (needs 2.0 s): CHAPTER 03 / 14
- [a_conv2d] 1.0 s (needs 2.0 s): CHAPTER 04 / 14
- [a_res] 1.0 s (needs 2.0 s): CHAPTER 05 / 14
- [a_nodes] 1.0 s (needs 2.0 s): CHAPTER 06 / 14
- [a_pool] 1.0 s (needs 2.0 s): CHAPTER 08 / 14
- [a_hsgal] 1.0 s (needs 2.0 s): CHAPTER 09 / 14
- [a_branch] 1.0 s (needs 2.0 s): CHAPTER 10 / 14
- [a_readout] 1.0 s (needs 2.0 s): CHAPTER 11 / 14
- [a_orig] 1.0 s (needs 2.0 s): CHAPTER 12 / 14
- [a_image] 2.25 s (needs 2.8 s): before: mean 1.38, std 0.49
- [a_hsgal] 2.5 s (needs 3.0 s): proj_type1: Linear (temporal)
- [a_hsgal] 2.5 s (needs 3.0 s): proj_type2: Linear (spectral)
- [a_conv2d] 1.25 s (needs 1.7 s): convolution
- [a_orig] 1.25 s (needs 1.6 s): comparison
- [a_pool] 7.5 s (needs 7.8 s): topk returns the kept nodes sorted by score, so they leave in score order, not r
- [a_res] 6.25 s (needs 6.4 s): GAT ×2 25,344 · attention convs 16,832 · pools, BN, pos_S, masters, out 3,530
- [a_recap] 5.25 s (needs 5.3 s): Bidirectional state space models (Hydra) mixed with attention.

## Message text under 20 px (7)
- [a_conv2d] 17 px: A 32 → 32 LAYER
- [a_nodes] 17 px: SPECTRAL SUMMARY
- [a_nodes] 17 px: TEMPORAL SUMMARY
- [a_gat] 17 px: ATTENTION WEIGHTS
- [a_hsgal] 17 px: TEMPORAL · SPECTRAL
- [a_orig] 17 px: ORIGINAL AASIST
- [a_code] 17 px: TRACE, BATCH OF 2

## Dead stretches ≥ 6 s (33)
- [a_intro] from 8.75 s for 6.2 s
- [a_overview] from 57.75 s for 10.2 s
- [a_start] from 131.5 s for 8.8 s
- [a_start] from 153.5 s for 8.0 s
- [a_start] from 189 s for 14.5 s
- [a_image] from 215.25 s for 7.2 s
- [a_image] from 228.25 s for 6.5 s
- [a_image] from 282.25 s for 10.0 s
- [a_conv2d] from 338 s for 7 s
- [a_conv2d] from 360 s for 8.5 s
- [a_res] from 414.25 s for 6.2 s
- [a_res] from 422.5 s for 6.2 s
- [a_nodes] from 447.5 s for 6.2 s
- [a_nodes] from 460 s for 6 s
- [a_nodes] from 467.5 s for 6.0 s
- [a_nodes] from 507.25 s for 6.5 s
- [a_gat] from 531 s for 11.8 s
- [a_gat] from 543.75 s for 11.2 s
- [a_gat] from 608.5 s for 7.0 s
- [a_pool] from 647.75 s for 6.5 s
- [a_hsgal] from 657.25 s for 10.0 s
- [a_hsgal] from 682.75 s for 9.5 s
- [a_hsgal] from 708.25 s for 6.0 s
- [a_hsgal] from 724.75 s for 6.2 s
- [a_branch] from 770.75 s for 7.5 s
- [a_readout] from 809.5 s for 6.5 s
- [a_readout] from 824.75 s for 7.0 s
- [a_readout] from 836.5 s for 8.5 s
- [a_orig] from 912.5 s for 7.5 s
- [a_code] from 921.75 s for 6.5 s
- [a_code] from 957.25 s for 6.2 s
- [a_recap] from 969.5 s for 8.5 s
- [a_recap] from 1025.25 s for 8.5 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
