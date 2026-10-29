# mambo metrics (16.95 min)

| scene | dur s | words | wpm (overall / speech) | beat wpm |
|---|---|---|---|---|
| m_intro | 54.3 | 116 | 128 / 160 | [126, 123, 159] |
| m_overview | 89.2 | 198 | 133 / 158 | [136, 139, 153, 140, 132, 124] |
| m_front | 38.8 | 89 | 138 / 170 | [149, 147] |
| m_inproj | 50.2 | 122 | 146 / 179 | [153, 151, 158] |
| m_stream | 67.4 | 159 | 142 / 165 | [145, 143, 154] |
| m_ssm | 140.5 | 347 | 148 / 180 | [154, 158, 146, 162, 141, 142, 155] |
| m_hydra | 63.0 | 153 | 146 / 178 | [153, 154, 146, 159] |
| m_hshapes | 123.5 | 309 | 150 / 181 | [155, 144, 156, 161, 164, 162, 141] |
| m_swiglu | 43.7 | 105 | 144 / 171 | [159, 152] |
| m_mha | 82.7 | 192 | 139 / 164 | [133, 142, 157, 135] |
| m_stack | 30.8 | 66 | 129 / 163 | [133, 149] |
| m_pool | 54.1 | 132 | 146 / 179 | [158, 156, 146] |
| m_train | 55.7 | 133 | 143 / 171 | [155, 147] |
| m_code | 44.8 | 101 | 135 / 166 | [153, 140, 142] |
| m_recap | 77.9 | 165 | 127 / 164 | [54, 143, 130, 153] |

## Text on screen shorter than its reading time (22)
- [m_ssm] 4.5 s (needs 7.1 s): big Δ: decay 0.20, the old state is mostly forgotten; this frame is written in s
- [m_ssm] 0.5 s (needs 1.8 s): one frame: (
- [m_overview] 1.0 s (needs 2.0 s): CHAPTER 01 / 14
- [m_front] 1.0 s (needs 2.0 s): CHAPTER 02 / 14
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
- [m_hshapes] 4.75 s (needs 5.3 s): y = forward + flip(backward): flipped back in time, then added
- [m_recap] 1.25 s (needs 1.6 s): comparison
- [m_swiglu] 1.5 s (needs 1.8 s): feed-forward
- [m_ssm] 5.0 s (needs 5.3 s): small Δ: decay 0.74, the memory is kept; the frame adds little
- [m_inproj] 1.5 s (needs 1.7 s): projection:
- [m_mha] 6.25 s (needs 6.3 s): MHA block: 68,096 params  ·  Hydra block: 137,612  ·  SwiGLU block: 131,072

## Message text under 20 px (0)

## Dead stretches ≥ 6 s (37)
- [m_intro] from 45.25 s for 8.8 s
- [m_overview] from 63.75 s for 7.5 s
- [m_overview] from 71.75 s for 9.2 s
- [m_overview] from 115.25 s for 10.0 s
- [m_overview] from 129.25 s for 14.0 s
- [m_front] from 168.75 s for 9.2 s
- [m_inproj] from 188.75 s for 9.0 s
- [m_inproj] from 214 s for 9.2 s
- [m_inproj] from 223.75 s for 8.5 s
- [m_stream] from 288.25 s for 11.5 s
- [m_ssm] from 312.75 s for 6.5 s
- [m_ssm] from 374 s for 6.2 s
- [m_ssm] from 383.75 s for 6.2 s
- [m_ssm] from 400.5 s for 7.0 s
- [m_ssm] from 413.5 s for 6.5 s
- [m_ssm] from 433.75 s for 6.5 s
- [m_hydra] from 443 s for 9 s
- [m_hydra] from 456.25 s for 6.5 s
- [m_hydra] from 496 s for 7.2 s
- [m_hshapes] from 565.25 s for 7.2 s
- [m_hshapes] from 581.25 s for 6.5 s
- [m_hshapes] from 596.75 s for 11.2 s
- [m_hshapes] from 619.75 s for 7.0 s
- [m_swiglu] from 635.25 s for 7.2 s
- [m_mha] from 678.75 s for 6.8 s
- [m_mha] from 691 s for 9 s
- [m_mha] from 724 s for 6 s
- [m_mha] from 732.5 s for 8.2 s
- [m_pool] from 799 s for 6.5 s
- [m_pool] from 806.25 s for 7.5 s
- [m_pool] from 831.25 s for 7.0 s
- [m_train] from 841 s for 13 s
- [m_train] from 872.25 s for 6.0 s
- [m_train] from 881.75 s for 7.0 s
- [m_code] from 929.25 s for 9.5 s
- [m_recap] from 979.75 s for 6.2 s
- [m_recap] from 999.25 s for 11.0 s

## Hectic stretches ≥ 1.5 s of heavy motion (0)
