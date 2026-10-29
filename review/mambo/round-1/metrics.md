# mambo metrics (16.17 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| m_intro | 53.7 | 116 | 130 / 160 | [126, 123, 166] |
| m_overview | 88.2 | 198 | 135 / 158 | [136, 139, 161, 140, 132, 124] |
| m_front | 38.8 | 89 | 138 / 170 | [149, 147] |
| m_inproj | 50.2 | 122 | 146 / 179 | [153, 151, 158] |
| m_stream | 67.4 | 159 | 142 / 165 | [145, 143, 154] |
| m_ssm | 123.4 | 318 | 155 / 182 | [154, 158, 162, 174, 150, 155] |
| m_hydra | 61.5 | 153 | 149 / 178 | [153, 154, 146, 180] |
| m_hshapes | 117.8 | 304 | 155 / 182 | [155, 144, 156, 174, 184, 141] |
| m_swiglu | 43.7 | 105 | 144 / 171 | [159, 152] |
| m_mha | 71.8 | 163 | 136 / 164 | [133, 142, 155, 135] |
| m_stack | 30.8 | 66 | 129 / 163 | [133, 149] |
| m_pool | 50.2 | 126 | 150 / 182 | [158, 167, 149] |
| m_train | 54.1 | 130 | 144 / 167 | [155, 149] |
| m_code | 44.8 | 101 | 135 / 166 | [153, 140, 142] |
| m_recap | 73.6 | 157 | 128 / 165 | [54, 143, 130, 154] |

## Text on screen shorter than its reading time (19)
- [m_front] 0.75 s (needs 2.0 s): CHAPTER 02 / 14
- [m_recap] 4.25 s (needs 5.4 s): wav2vec 2.0, AASIST and XLSR-MamBo: every tensor accounted for.
- [m_overview] 1.0 s (needs 2.0 s): CHAPTER 01 / 14
- [m_inproj] 1.0 s (needs 2.0 s): CHAPTER 03 / 14
- [m_stream] 1.0 s (needs 2.0 s): CHAPTER 04 / 14
- [m_ssm] 1.0 s (needs 2.0 s): CHAPTER 05 / 14
- [m_hydra] 1.0 s (needs 2.0 s): CHAPTER 06 / 14
- [m_hshapes] 1.0 s (needs 2.0 s): CHAPTER 07 / 14
- [m_swiglu] 1.0 s (needs 2.0 s): CHAPTER 08 / 14
- [m_mha] 1.0 s (needs 2.0 s): CHAPTER 09 / 14
- [m_stack] 1.0 s (needs 2.0 s): CHAPTER 10 / 14
- [m_pool] 1.0 s (needs 2.0 s): CHAPTER 11 / 14
- [m_train] 1.0 s (needs 2.0 s): CHAPTER 12 / 14
- [m_code] 1.0 s (needs 2.0 s): CHAPTER 13 / 14
- [m_recap] 1.0 s (needs 2.0 s): CHAPTER 14 / 14
- [m_inproj] 1.25 s (needs 1.7 s): projection:
- [m_swiglu] 1.5 s (needs 1.8 s): feed-forward
- [m_recap] 1.5 s (needs 1.6 s): comparison
- [m_recap] 3.5 s (needs 3.6 s): ganesh-deepak.github.io/voice-deepfake

## Message text under 20 px (3)
- [m_overview] 18 px: Linear · RMSNorm · SiLU
- [m_overview] 18 px: Hydra×3 · MLP · MHA · MLP
- [m_overview] 18 px: weights over time

## Dead stretches ≥ 6 s (40)
- [m_intro] from 45.5 s for 8.0 s
- [m_overview] from 58.25 s for 12.2 s
- [m_overview] from 71.25 s for 10.5 s
- [m_overview] from 114 s for 9.5 s
- [m_overview] from 130.25 s for 11.5 s
- [m_front] from 165.75 s for 14.8 s
- [m_inproj] from 187 s for 9 s
- [m_inproj] from 212.25 s for 6.0 s
- [m_inproj] from 218.5 s for 12.2 s
- [m_stream] from 286.5 s for 11.8 s
- [m_ssm] from 305.75 s for 12.2 s
- [m_ssm] from 328 s for 7.5 s
- [m_ssm] from 336.5 s for 6.5 s
- [m_ssm] from 347.5 s for 11.8 s
- [m_ssm] from 366 s for 6 s
- [m_ssm] from 385.25 s for 8.5 s
- [m_ssm] from 394.75 s for 6.0 s
- [m_ssm] from 406.5 s for 15.0 s
- [m_hydra] from 427.75 s for 9.5 s
- [m_hydra] from 444.75 s for 8.8 s
- [m_hydra] from 462 s for 8.8 s
- [m_hydra] from 476 s for 7 s
- [m_hshapes] from 486.25 s for 12.2 s
- [m_hshapes] from 552.25 s for 12.2 s
- [m_hshapes] from 568.25 s for 10.0 s
- [m_hshapes] from 586.75 s for 14.0 s
- [m_swiglu] from 608.25 s for 8.2 s
- [m_swiglu] from 623 s for 7.8 s
- [m_swiglu] from 632.25 s for 12.2 s
- [m_mha] from 647.5 s for 12.0 s
- [m_mha] from 698 s for 6.2 s
- [m_mha] from 704.5 s for 12.0 s
- [m_stack] from 738.25 s for 9.0 s
- [m_pool] from 788.5 s for 9.0 s
- [m_train] from 800.25 s for 8.2 s
- [m_train] from 839.5 s for 12.0 s
- [m_code] from 856 s for 12.2 s
- [m_code] from 887.5 s for 9.0 s
- [m_recap] from 940.25 s for 6.5 s
- [m_recap] from 947 s for 17.8 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
