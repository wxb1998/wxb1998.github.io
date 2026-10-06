---
title: Aging of the Primate Adrenal Gland
summary: Single-cell atlas of young and old cynomolgus monkey adrenal glands.
order: 1
tags: [R, Seurat, DESeq2, SCENIC, Monocle, CellPhoneDB]
pipeline: [QC, Doublets, Integration, Annotation, DEGs, Regulons, Trajectories, Cell–cell comm.]
metrics:
  - value: "12"
    label: analysis modules
  - value: "2"
    label: data modalities (sc + bulk)
links:
  code: https://github.com/wxb1998/R_adrenal
---

Single-cell transcriptomic profiling of young and old *Macaca fascicularis* adrenal glands, paired
with bulk RNA-seq. The analysis maps every cell type of the gland, then asks what changes with age:
differentially expressed genes, transcription-factor regulons, pseudotime trajectories, ligand–receptor
signalling between cell types, and gene-set scores for aging-related pathways.
