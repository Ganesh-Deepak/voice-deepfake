# mambo metrics (16.8 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| m_intro | 54.3 | 116 | 128 / 160 | [126, 123, 159] |
| m_overview | 89.2 | 198 | 133 / 158 | [136, 139, 153, 140, 132, 124] |
| m_front | 38.8 | 89 | 138 / 170 | [149, 147] |
| m_inproj | 50.2 | 122 | 146 / 179 | [153, 151, 158] |
| m_stream | 67.4 | 159 | 142 / 165 | [145, 143, 154] |
| m_ssm | 134.5 | 336 | 150 / 181 | [154, 158, 146, 162, 149, 155] |
| m_hydra | 63.0 | 153 | 146 / 178 | [153, 154, 146, 159] |
| m_hshapes | 121.9 | 306 | 151 / 182 | [155, 144, 156, 165, 164, 162, 141] |
| m_swiglu | 43.7 | 105 | 144 / 171 | [159, 152] |
| m_mha | 82.7 | 192 | 139 / 164 | [133, 142, 157, 135] |
| m_stack | 30.8 | 66 | 129 / 163 | [133, 149] |
| m_pool | 54.1 | 132 | 146 / 179 | [158, 156, 146] |
| m_train | 58.1 | 140 | 144 / 167 | [155, 149] |
| m_code | 44.8 | 101 | 135 / 166 | [153, 140, 142] |
| m_recap | 74.6 | 157 | 126 / 165 | [54, 143, 130, 154] |

## Text on screen shorter than its reading time (20)
- [m_swiglu] 0.75 s (needs 2.0 s): CHAPTER 08 / 14
- [m_pool] 0.75 s (needs 2.0 s): CHAPTER 11 / 14
- [m_code] 0.75 s (needs 2.0 s): CHAPTER 13 / 14
- [m_overview] 1.0 s (needs 2.0 s): CHAPTER 01 / 14
- [m_front] 1.0 s (needs 2.0 s): CHAPTER 02 / 14
- [m_inproj] 1.0 s (needs 2.0 s): CHAPTER 03 / 14
- [m_stream] 1.0 s (needs 2.0 s): CHAPTER 04 / 14
- [m_ssm] 1.0 s (needs 2.0 s): CHAPTER 05 / 14
- [m_hydra] 1.0 s (needs 2.0 s): CHAPTER 06 / 14
- [m_hshapes] 1.0 s (needs 2.0 s): CHAPTER 07 / 14
- [m_mha] 1.0 s (needs 2.0 s): CHAPTER 09 / 14
- [m_stack] 1.0 s (needs 2.0 s): CHAPTER 10 / 14
- [m_train] 1.0 s (needs 2.0 s): CHAPTER 12 / 14
- [m_recap] 1.0 s (needs 2.0 s): CHAPTER 14 / 14
- [m_swiglu] 1.25 s (needs 1.8 s): feed-forward
- [m_ssm] 3.25 s (needs 3.8 s): 4 heads × (64 × 64) state, per direction
- [m_hshapes] 4.75 s (needs 5.3 s): y = forward + flip(backward): flipped back in time, then added
- [m_recap] 1.25 s (needs 1.6 s): comparison
- [m_inproj] 1.5 s (needs 1.7 s): projection:
- [m_hshapes] 2.5 s (needs 2.5 s): scan output: same shape

## Message text under 20 px (3)
- [m_hshapes] 18 px: · xBC 512 · Δ 8
- [m_hshapes] 17 px: FLIPPED BACK, ADDED
- [m_code] 17 px: TRACE, BATCH OF 2

## Dead stretches ≥ 6 s (36)
- [m_intro] from 45.25 s for 8.8 s
- [m_overview] from 63.75 s for 7.5 s
- [m_overview] from 71.75 s for 9.2 s
- [m_overview] from 115.25 s for 10.0 s
- [m_overview] from 131.75 s for 11.5 s
- [m_front] from 168.75 s for 9.2 s
- [m_inproj] from 188.75 s for 8.8 s
- [m_inproj] from 214 s for 18.2 s
- [m_stream] from 288.25 s for 11.5 s
- [m_ssm] from 307.5 s for 12.0 s
- [m_ssm] from 346.75 s for 16.8 s
- [m_ssm] from 364 s for 6.2 s
- [m_ssm] from 371 s for 9.2 s
- [m_ssm] from 388.25 s for 8.5 s
- [m_ssm] from 397.25 s for 6.0 s
- [m_ssm] from 407.25 s for 15.5 s
- [m_ssm] from 427.75 s for 6.5 s
- [m_hydra] from 437 s for 9 s
- [m_hydra] from 450.25 s for 6.5 s
- [m_hydra] from 490 s for 7.2 s
- [m_hshapes] from 559 s for 7.5 s
- [m_hshapes] from 589.5 s for 10.8 s
- [m_hshapes] from 612 s for 7.2 s
- [m_swiglu] from 627.5 s for 7.5 s
- [m_mha] from 665.75 s for 12.0 s
- [m_mha] from 716 s for 6.2 s
- [m_mha] from 726 s for 8.2 s
- [m_pool] from 798.5 s for 7.5 s
- [m_pool] from 823.5 s for 7.0 s
- [m_train] from 833.5 s for 12.8 s
- [m_train] from 876.75 s for 6.8 s
- [m_code] from 903 s for 6 s
- [m_code] from 924 s for 9.5 s
- [m_recap] from 974.75 s for 6.0 s
- [m_recap] from 987.25 s for 6.2 s
- [m_recap] from 994 s for 7.8 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
